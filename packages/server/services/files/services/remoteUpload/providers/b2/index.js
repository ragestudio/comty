import fs from "node:fs"
import path from "node:path"

export default async ({
    source,
    remotePath,
    metadata = {},
    targetFilename,
    isDirectory,
}) => {
    // use backblaze b2
    await global.b2Storage.authorize()

    const uploadUrl = await global.b2Storage.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID,
    })

    if (!fs.existsSync(source)) {
        throw new OperationError(500, "File not found")
    }

    const data = await fs.promises.readFile(source)

    await global.b2Storage.uploadFile({
        uploadUrl: uploadUrl.data.uploadUrl,
        uploadAuthToken: uploadUrl.data.authorizationToken,
        fileName: remotePath,
        data: data,
        info: metadata
    })

    const url = `https://${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${remotePath}`

    return {
        id: remotePath,
        url: url,
        metadata: metadata,
    }
}