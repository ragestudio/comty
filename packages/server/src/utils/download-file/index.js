import fs from "fs"
import path from "path"
import axios from "axios"

export default async (payload) => {
    let { url, destination } = payload

    // if destination path is not provided, use cache folder
    if (!destination) {
        destination = path.resolve(global.uploadCachePath, path.basename(url))
    }

    console.log(destination)

    const writer = fs.createWriteStream(destination)

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve({
            destination,
            delete: () => fs.unlinkSync(destination),
            read: () => fs.readFileSync(destination),
        }))
        writer.on("error", reject)
    })
}