import path from "node:path"
import fs from "node:fs"

import RemoteUpload from "@services/remoteUpload"

export default {
    useContext: ["cache"],
    middlewares: [
        "withAuthentication",
    ],
    fn: async (req, res) => {
        const { cache } = this.default.contexts

        const providerType = req.headers["provider-type"] ?? "standard"

        const userPath = path.join(cache.constructor.cachePath, req.auth.session.user_id)

        let localFilepath = null
        let tmpPath =  path.resolve(userPath, `${Date.now()}`)

        await req.multipart(async (field) => {
            if (!field.file) {
                throw new OperationError(400, "Missing file")
            }

            localFilepath = path.join(tmpPath, field.file.name)

            const existTmpDir = await fs.promises.stat(tmpPath).then(() => true).catch(() => false)

            if (!existTmpDir) {
                await fs.promises.mkdir(tmpPath, { recursive: true })
            }

            await field.write(localFilepath)
        })

        const result = await RemoteUpload({
            parentDir: req.auth.session.user_id,
            source: localFilepath,
            service: providerType,
            useCompression: ToBoolean(req.headers["use-compression"]) ?? true,
        })

        fs.promises.rm(tmpPath, { recursive: true, force: true })

        return result
    }
}
