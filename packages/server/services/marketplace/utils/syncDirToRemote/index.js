import fs from "fs"
import path from "path"

async function syncFolder(dir, destPath) {
    const files = await fs.promises.readdir(dir)

    for await (const file of files) {
        const filePath = path.resolve(dir, file)
        const desitinationFilePath = `${destPath}/${file}`

        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            await syncFolder(filePath, desitinationFilePath)
        } else {
            const fileContent = await fs.promises.readFile(filePath)

            await global.storage.putObject(process.env.S3_BUCKET, desitinationFilePath, fileContent)
        }
    }
}

export default syncFolder