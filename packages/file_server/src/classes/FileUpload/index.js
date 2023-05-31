// Orginal forked from: Buzut/huge-uploader-nodejs
// Copyright (c) 2018, Quentin Busuttil All rights reserved.

import fs from "node:fs"
import path from "node:path"
import { promisify } from "node:util"
import mimetypes from "mime-types"
import crypto from "node:crypto"

import Busboy from "busboy"

export function getFileHash(file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256")

        file.on("data", (chunk) => hash.update(chunk))

        file.on("end", () => resolve(hash.digest("hex")))

        file.on("error", reject)
    })
}

export function checkHeaders(headers) {
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

export function checkTotalSize(maxFileSize, maxChunkSize, totalChunks) {
    if (maxChunkSize * totalChunks > maxFileSize) {
        return false
    }

    return true
}

export function cleanChunks(dirPath) {
    fs.readdir(dirPath, (err, files) => {
        let filesLength = files.length

        files.forEach((file) => {
            fs.unlink(path.join(dirPath, file), () => {
                if (--filesLength === 0) fs.rmdir(dirPath, () => { }) // cb does nothing but required
            })
        })
    })
}

export function createAssembleChunksPromise({
    tmpDir,
    headers,
}) {
    const asyncReadFile = promisify(fs.readFile)
    const asyncAppendFile = promisify(fs.appendFile)

    const originalMimeType = mimetypes.lookup(headers["uploader-original-name"])
    const originalExtension = mimetypes.extension(originalMimeType)

    const totalChunks = +headers["uploader-chunks-total"]

    const fileId = headers["uploader-file-id"]
    const workPath = path.join(tmpDir, fileId)
    const chunksPath = path.resolve(workPath, "chunks")
    const assembledFilepath = path.join(workPath, `assembled.${originalExtension}`)

    let chunkCount = 0
    let finalFilepath = null

    return () => {
        return new Promise((resolve, reject) => {
            const onEnd = async () => {
                try {
                    const hash = await getFileHash(fs.createReadStream(assembledFilepath))

                    finalFilepath = path.resolve(workPath, `${hash}_${Date.now()}.${originalExtension}`)

                    fs.renameSync(assembledFilepath, finalFilepath)

                    cleanChunks(chunksPath)

                    return resolve({
                        filename: headers["uploader-original-name"],
                        filepath: finalFilepath,
                        cachePath: workPath,
                        hash,
                        mimetype: originalMimeType,
                        extension: originalExtension,
                    })
                } catch (error) {
                    return reject(error)
                }
            }

            const pipeChunk = () => {
                asyncReadFile(path.join(chunksPath, chunkCount.toString()))
                    .then((chunk) => asyncAppendFile(assembledFilepath, chunk))
                    .then(() => {
                        // 0 indexed files = length - 1, so increment before comparison
                        if (totalChunks > ++chunkCount) {
                            return pipeChunk(chunkCount)
                        }

                        return onEnd()
                    })
                    .catch(reject)
            }

            pipeChunk()
        })
    }
}

export function mkdirIfDoesntExist(dirPath, callback) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdir(dirPath, { recursive: true }, callback)
    }
}

export function handleFile(tmpDir, headers, fileStream) {
    const dirPath = path.join(tmpDir, headers["uploader-file-id"])
    const chunksPath = path.join(dirPath, "chunks")
    const chunkPath = path.join(chunksPath, headers["uploader-chunk-number"])
    const chunkCount = +headers["uploader-chunk-number"]
    const totalChunks = +headers["uploader-chunks-total"]

    let error
    let assembleChunksPromise
    let finished = false
    let writeStream

    const writeFile = () => {
        writeStream = fs.createWriteStream(chunkPath)

        writeStream.on("error", (err) => {
            error = err
            fileStream.resume()
        })

        writeStream.on("close", () => {
            finished = true

            // if all is uploaded
            if (chunkCount === totalChunks - 1) {
                assembleChunksPromise = createAssembleChunksPromise({
                    tmpDir,
                    headers,
                })
            }
        })

        fileStream.pipe(writeStream)
    }

    // make sure chunk is in range
    if (chunkCount < 0 || chunkCount >= totalChunks) {
        error = new Error("Chunk is out of range")
        fileStream.resume()
    }

    else if (chunkCount === 0) {
        // create file upload dir if it's first chunk
        mkdirIfDoesntExist(chunksPath, (err) => {
            if (err) {
                error = err
                fileStream.resume()
            }

            else writeFile()
        })
    }

    else {
        // make sure dir exists if it's not first chunk
        fs.stat(dirPath, (err) => {
            if (err) {
                error = new Error("Upload has expired")
                fileStream.resume()
            }

            else writeFile()
        })
    }

    return (callback) => {
        if (finished && !error) callback(null, assembleChunksPromise)
        else if (error) callback(error)

        else {
            writeStream.on("error", callback)
            writeStream.on("close", () => callback(null, assembleChunksPromise))
        }
    }
}

export function uploadFile(req, tmpDir, maxFileSize, maxChunkSize) {
    return new Promise((resolve, reject) => {
        if (!checkHeaders(req.headers)) {
            reject(new Error("Missing header(s)"))
            return
        }

        if (!checkTotalSize(maxFileSize, req.headers["uploader-chunks-total"])) {
            reject(new Error("File is above size limit"))
            return
        }

        try {
            let limitReached = false
            let getFileStatus

            const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: maxChunkSize * 1000 * 1000 } })

            busboy.on("file", (fieldname, fileStream) => {
                fileStream.on("limit", () => {
                    limitReached = true
                    fileStream.resume()
                })

                getFileStatus = handleFile(tmpDir, req.headers, fileStream)
            })

            busboy.on("close", () => {
                if (limitReached) {
                    reject(new Error("Chunk is above size limit"))
                    return
                }

                getFileStatus((fileErr, assembleChunksF) => {
                    if (fileErr) reject(fileErr)
                    else resolve(assembleChunksF)
                })
            })

            req.pipe(busboy)
        }

        catch (err) {
            reject(err)
        }
    })
}

export default uploadFile