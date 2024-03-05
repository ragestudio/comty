import fs from "fs"
import path from "path"
import axios from "axios"

export default async (payload) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { url, destination } = payload

            // if destination path is not provided, use cache folder
            if (!destination) {
                destination = path.resolve(global.uploadCachePath, path.basename(url))
            }

            const writer = fs.createWriteStream(destination)

            if (!writer) {
                return false
            }

            const response = await axios({
                url,
                method: "GET",
                responseType: "stream"
            })

            response.data.pipe(writer)

            writer.on("finish", () => resolve({
                destination,
                delete: () => fs.unlinkSync(destination),
                read: () => fs.readFileSync(destination),
            }))
            writer.on("error", reject)
        } catch (error) {
            reject(error)
        }
    })
}