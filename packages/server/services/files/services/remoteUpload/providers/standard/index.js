import fs from "node:fs"
import path from "node:path"
import pMap from "p-map"

export default async function standardUpload({
    source,
    remotePath,
    metadata = {},
    targetFilename,
    isDirectory,
}) {
    if (isDirectory) {
        let files = await fs.promises.readdir(source)

        files = files.map((file) => {
            const filePath = path.join(source, file)

            const isTargetDirectory = fs.lstatSync(filePath).isDirectory()

            return {
                source: filePath,
                remotePath: path.join(remotePath, file),
                isDirectory: isTargetDirectory,
            }
        })

        await pMap(
            files,
            standardUpload,
            {
                concurrency: 3
            }
        )

        return {
            id: remotePath,
            url: global.storage.composeRemoteURL(remotePath, targetFilename),
            metadata: metadata,
        }
    }

    console.debug(`Uploading object to S3 Minio >`, {
        source: source,
        remote: remotePath,
    })

    // upload to storage
    await global.storage.fPutObject(process.env.S3_BUCKET, remotePath, source, metadata)

    // compose url
    const url = global.storage.composeRemoteURL(remotePath)

    return {
        id: remotePath,
        url: url,
        metadata: metadata,
    }
}