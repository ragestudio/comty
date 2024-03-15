// Orginal forked from: Buzut/huge-uploader-nodejs
// Copyright (c) 2018, Quentin Busuttil All rights reserved.

import fs from "node:fs"
import path from "node:path"
import mimetypes from "mime-types"

export function checkTotalSize(
    chunkSize, // in bytes 
    totalChunks, // number of chunks
    maxFileSize, // in bytes
) {
    const totalSize = chunkSize * totalChunks

    if (totalSize > maxFileSize) {
        return false
    }

    return true
}

export function checkChunkUploadHeaders(headers) {
    if (
        !headers["uploader-chunk-number"] ||
        !headers["uploader-chunks-total"] ||
        !headers["uploader-original-name"] ||
        !headers["uploader-file-id"] ||
        !headers["uploader-chunks-total"].match(/^[0-9]+$/) ||
        !headers["uploader-chunk-number"].match(/^[0-9]+$/)
    ) {
        return false
    }

    return true
}

export function createAssembleChunksPromise({
    chunksPath, // chunks to assemble
    filePath, // final assembled file path
    maxFileSize,
}) {
    return () => new Promise(async (resolve, reject) => {
        let fileSize = 0

        const chunks = await fs.promises.readdir(chunksPath)

        if (chunks.length === 0) {
            throw new Error("No chunks found")
        }

        for await (const chunk of chunks) {
            const chunkPath = path.join(chunksPath, chunk)
            const data = await fs.promises.readFile(chunkPath)

            fileSize += data.length

            // check if final file gonna exceed max file size
            // in case early estimation is wrong (due client send bad headers)
            if (fileSize > maxFileSize) {
                return reject(new OperationError(413, "File exceeds max total file size, aborting assembly..."))
            }

            await fs.promises.appendFile(filePath, data)

            continue
        }

        return resolve({
            chunksLength: chunks.length,
            filePath: filePath,
        })
    })
}

export async function handleChunkFile(fileStream, { tmpDir, headers, maxFileSize, maxChunkSize }) {
    return await new Promise(async (resolve, reject) => {
        const chunksPath = path.join(tmpDir, headers["uploader-file-id"], "chunks")
        const chunkPath = path.join(chunksPath, headers["uploader-chunk-number"])

        const chunkCount = +headers["uploader-chunk-number"]
        const totalChunks = +headers["uploader-chunks-total"]

        // check if file has all chunks uploaded
        const isLast = chunkCount === totalChunks - 1

        // make sure chunk is in range
        if (chunkCount < 0 || chunkCount >= totalChunks) {
            throw new Error("Chunk is out of range")
        }

        // if is the first chunk check if dir exists before write things
        if (chunkCount === 0) {
            if (!await fs.promises.stat(chunksPath).catch(() => false)) {
                await fs.promises.mkdir(chunksPath, { recursive: true })
            }
        }

        let dataWritten = 0

        let writeStream = fs.createWriteStream(chunkPath)

        writeStream.on("error", (err) => {
            reject(err)
        })

        writeStream.on("close", () => {
            if (maxChunkSize !== undefined) {
                if (dataWritten > maxChunkSize) {
                    reject(new OperationError(413, "Chunk size exceeds max chunk size, aborting upload..."))
                    return
                }

                // estimate total file size,
                // if estimation exceeds maxFileSize, abort upload
                if (chunkCount === 0 && totalChunks > 0) {
                    if ((dataWritten * (totalChunks - 1)) > maxFileSize) {
                        reject(new OperationError(413, "File estimated size exceeds max total file size, aborting upload..."))
                        return
                    }
                }
            }

            if (isLast) {
                const mimetype = mimetypes.lookup(headers["uploader-original-name"])
                const extension = mimetypes.extension(mimetype)

                let filename = headers["uploader-file-id"]

                if (headers["uploader-use-date"] === "true") {
                    filename = `${filename}_${Date.now()}`
                }

                return resolve(createAssembleChunksPromise({
                    // build data
                    chunksPath: chunksPath,
                    filePath: path.resolve(chunksPath, `${filename}.${extension}`),
                    maxFileSize: maxFileSize,
                }))
            }

            return resolve(null)
        })

        fileStream.on("data", (buffer) => {
            dataWritten += buffer.byteLength
        })

        fileStream.pipe(writeStream)
    })
}

export async function uploadChunkFile(req, {
    tmpDir,
    maxFileSize,
    maxChunkSize,
}) {
    return await new Promise(async (resolve, reject) => {
        if (!checkChunkUploadHeaders(req.headers)) {
            reject(new OperationErrorError(400, "Missing header(s)"))
            return
        }

        await req.multipart(async (field) => {
            try {
                const result = await handleChunkFile(field.file.stream, {
                    tmpDir: tmpDir,
                    headers: req.headers,
                    maxFileSize: maxFileSize,
                    maxChunkSize: maxChunkSize,
                })

                return resolve(result)
            } catch (error) {
                return reject(error)
            }
        })
    })
}

export default uploadChunkFile