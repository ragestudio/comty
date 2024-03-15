import fs from "node:fs"
import crypto from "crypto"

export default async (file) => {
    return new Promise((resolve, reject) => {
        if (typeof file === "string") {
            file = fs.createReadStream(file)
        }

        const hash = crypto.createHash("sha256")

        file.on("data", (chunk) => hash.update(chunk))

        file.on("end", () => resolve(hash.digest("hex")))

        file.on("error", reject)
    })
}