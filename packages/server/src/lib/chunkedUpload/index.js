import fs from "fs"
import path from "path"
import mime from "mime-types"
import Busboy from "busboy"
import crypto from "crypto"
import { fsMerge } from "split-chunk-merge"

export default class ChunkedUpload {
    constructor(options = {}) {
        this.options = options

        this.outputPath = options.outputPath
        this.tmpPath = options.tmpPath ?? "/tmp"

        this.maxFileSize = options.maxFileSize ?? 95
        this.acceptedMimeTypes = options.acceptedMimeTypes ?? [
            "image/*",
            "video/*",
            "audio/*",
        ]

        this.strictHashCheck = options.strictHashCheck ?? false

        if (!this.outputPath) {
            throw new Error("Missing outputPath")
        }
    }

    _isLastPart = (contentRange) => {
        return contentRange.size === contentRange.end + 1
    }

    _makeSureDirExists = dirName => {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true })
        }
    }

    _buildOriginalFile = async (fileHash, filename) => {
        const chunkPartsPath = path.join(this.tmpPath, fileHash)
        const mergedFilePath = path.join(this.outputPath, filename)

        let partsFilenames = fs.readdirSync(chunkPartsPath)

        // sort the parts
        partsFilenames = partsFilenames.sort((a, b) => {
            const aNumber = Number(a)
            const bNumber = Number(b)

            if (aNumber < bNumber) {
                return -1
            }

            if (aNumber > bNumber) {
                return 1
            }

            return 0
        })

        partsFilenames = partsFilenames.map((partFilename) => {
            return path.join(chunkPartsPath, partFilename)
        })

        // merge the parts
        await fsMerge(partsFilenames, mergedFilePath)

        // check hash
        if (this.strictHashCheck) {
            const mergedFileHash = await this._getFileHash(mergedFilePath)

            if (mergedFileHash !== fileHash) {
                throw new Error("File hash mismatch")
            }
        }

        //fs.rmdirSync(chunkPartsPath, { recursive: true })

        return mergedFilePath
    }

    _getFileHash = async (filePath) => {
        const buffer = await fs.promises.readFile(filePath)

        const hash = await crypto.createHash("sha256")
            .update(buffer)
            .digest()

        return hash.toString("hex")
    }

    makeMiddleware = () => {
        return (req, res, next) => {
            const busboy = Busboy({ headers: req.headers })

            busboy.on("file", async (fieldName, file, info) => {
                try {
                    const fileHash = req.headers["file-hash"]
                    const chunkNumber = req.chunkNumber = req.headers["file-chunk-number"]
                    const totalChunks = req.headers["file-total-chunks"]
                    const fileSize = req.headers["file-size"]

                    if (!fileHash) {
                        return res.status(400).json({
                            error: "Missing header [file-hash]",
                        })
                    }

                    if (!chunkNumber) {
                        return res.status(400).json({
                            error: "Missing header [file-chunk-number]",
                        })
                    }

                    if (!totalChunks) {
                        return res.status(400).json({
                            error: "Missing header [file-total-chunks]",
                        })
                    }

                    if (!fileSize) {
                        return res.status(400).json({
                            error: "Missing header [file-size]",
                        })
                    }

                    // check if file size is allowed
                    if (fileSize > this.maxFileSize) {
                        if (typeof this.options.onExceedMaxFileSize === "function") {
                            const result = await this.options.onExceedMaxFileSize({
                                fileHash,
                                chunkNumber,
                                totalChunks,
                                fileSize,
                                headers: req.headers,
                                user: req.user,
                            })

                            if (!result) {
                                return res.status(413).json({
                                    error: "File size is too big",
                                })
                            }
                        } else {
                            return res.status(413).json({
                                error: "File size is too big",
                            })
                        }
                    }

                    // check if allowedMimeTypes is an array and if it contains the file's mimetype
                    if (this.acceptedMimeTypes && Array.isArray(this.acceptedMimeTypes)) {
                        const regex = new RegExp(this.acceptedMimeTypes.join("|").replace(/\*/g, "[a-z]+").replace(/!/g, "^"), "i")

                        if (!regex.test(info.mimeType)) {
                            return res.status(400).json({
                                error: "File type is not allowed",
                                mimeType: info.mimeType,
                            })
                        }
                    }

                    const filePath = path.join(this.tmpPath, fileHash)
                    const chunkPath = path.join(filePath, chunkNumber)

                    this._makeSureDirExists(filePath)

                    const writeStream = fs.createWriteStream(chunkPath, { flags: "a" })

                    file.pipe(writeStream)

                    file.on("end", async () => {
                        if (Number(chunkNumber) === totalChunks - 1) {
                            try {
                                // build final filename
                                const realMimeType = mime.lookup(info.filename)
                                const finalFilenameExtension = mime.extension(realMimeType)
                                const finalFilename = `${fileHash}.${finalFilenameExtension}`

                                const buildResult = await this._buildOriginalFile(
                                    fileHash,
                                    finalFilename,
                                )
                                    .catch((err) => {
                                        res.status(500).json({
                                            error: "Failed to build final file",
                                        })

                                        return false
                                    })

                                if (buildResult) {
                                    req.isLastPart = true
                                    req.fileResult = {
                                        fileHash,
                                        filepath: buildResult,
                                        filename: finalFilename,
                                        mimetype: realMimeType,
                                        size: fileSize,
                                    }

                                    global.cacheService.appendToDeletion(buildResult)

                                    next()
                                }
                            } catch (error) {
                                return res.status(500).json({
                                    error: "Failed to build final file",
                                })
                            }
                        } else {
                            req.isLastPart = false

                            return res.status(200).json({
                                message: "Chunk uploaded",
                                chunkNumber,
                            })
                        }
                    })
                } catch (error) {
                    console.log("error:", error)

                    return res.status(500).json({
                        error: "Failed to upload file",
                    })
                }
            })

            req.pipe(busboy)
        }
    }
}