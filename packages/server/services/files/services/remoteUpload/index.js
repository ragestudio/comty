import fs from "node:fs"
import path from "node:path"
import mimeTypes from "mime-types"
import getFileHash from "@shared-utils/readFileHash"

import PostProcess from "../post-process"

export async function standardUpload({
    source,
    remotePath,
    metadata,
}) {
    // upload to storage
    await global.storage.fPutObject(process.env.S3_BUCKET, remotePath, source, metadata)

    // compose url
    const url = storage.composeRemoteURL(remotePath)

    return {
        id: remotePath,
        url: url,
        metadata: metadata,
    }
}

export async function b2Upload({
    source,
    remotePath,
    metadata,
}) {
    // use backblaze b2
    await b2Storage.authorize()

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

export default async ({
    source,
    parentDir,
    service,
    useCompression,
    cachePath,
}) => {
    if (!source) {
        throw new OperationError(500, "source is required")
    }

    if (!service) {
        service = "standard"
    }

    if (!parentDir) {
        parentDir = "/"
    }

    if (useCompression) {
        try {
            const processOutput = await PostProcess({ filepath: source, cachePath })

            if (processOutput) {
                if (processOutput.filepath) {
                    source = processOutput.filepath
                }
            }
        } catch (error) {
            console.error(error)
            throw new OperationError(500, `Failed to process file`)
        }
    }

    const type = mimeTypes.lookup(path.basename(source))
    const hash = await getFileHash(fs.createReadStream(source))

    const remotePath = path.join(parentDir, hash)

    let result = {}

    const metadata = {
        "Content-Type": type,
        "File-Hash": hash,
    }

    switch (service) {
        case "b2":
            if (!global.b2Storage) {
                throw new OperationError(500, "B2 storage not configured on environment, unsupported service. Please use `standard` service.")
            }

            result = await b2Upload({
                remotePath,
                source,
                metadata,
            })
            break
        case "standard":
            result = await standardUpload({
                remotePath,
                source,
                metadata,
            })
            break
        default:
            throw new OperationError(500, "Unsupported service")
    }

    return result
}