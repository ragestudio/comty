import path from "node:path"
import fs from "node:fs"
import axios from "axios"

import MultiqualityHLSJob from "@shared-classes/MultiqualityHLSJob"
import { standardUpload } from "@services/remoteUpload"

export default {
    useContext: ["cache", "limits"],
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { url } = req.query

        const userPath = path.join(this.default.contexts.cache.constructor.cachePath, req.auth.session.user_id)

        const jobId = String(new Date().getTime())
        const jobPath = path.resolve(userPath, "jobs", jobId)

        const sourcePath = path.resolve(jobPath, `${jobId}.source`)

        if (!fs.existsSync(jobPath)) {
            fs.mkdirSync(jobPath, { recursive: true })
        }

        const sourceStream = fs.createWriteStream(sourcePath)

        const response = await axios({
            method: "get",
            url,
            responseType: "stream",
        })

        response.data.pipe(sourceStream)

        await new Promise((resolve, reject) => {
            sourceStream.on("finish", () => {
                resolve()
            })
            sourceStream.on("error", (err) => {
                reject(err)
            })
        })

        const job = new MultiqualityHLSJob({
            input: sourcePath,
            outputDir: jobPath,
            levels: [
                {
                    original: true,
                    codec: "libx264",
                    bitrate: "10M",
                    preset: "ultrafast",
                },
                {
                    codec: "libx264",
                    width: 1280,
                    bitrate: "3M",
                    preset: "ultrafast",
                }
            ]
        })

        await new Promise((resolve, reject) => {
            job
                .on("error", (err) => {
                    console.error(`[TRANSMUX] Transmuxing failed`, err)
                    reject(err)
                })
                .on("end", () => {
                    console.debug(`[TRANSMUX] Finished transmuxing > ${sourcePath}`)
                    resolve()
                })
                .run()
        })

        const result = await standardUpload({
            isDirectory: true,
            source: path.join(jobPath, "hls"),
            remotePath: `${req.auth.session.user_id}/jobs/${jobId}`,
        })

        fs.rmSync(jobPath, { recursive: true, force: true })

        return {
            result
        }
    }
}