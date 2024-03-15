import path from "path"
import fs from "fs"

import ChunkFileUpload from "@shared-classes/ChunkFileUpload"

import RemoteUpload from "@services/remoteUpload"

export default {
    useContext: ["cache", "limits"],
    middlewares: [
        "withAuthentication",
    ],
    fn: async (req, res) => {
        const providerType = req.headers["provider-type"]

        const userPath = path.join(this.default.contexts.cache.constructor.cachePath, req.auth.session.user_id)

        const tmpPath = path.resolve(userPath)

        let build = await ChunkFileUpload(req, {
            tmpDir: tmpPath,
            maxFileSize: parseInt(this.default.contexts.limits.maxFileSizeInMB) * 1024 * 1024,
            maxChunkSize: parseInt(this.default.contexts.limits.maxChunkSizeInMB) * 1024 * 1024,
        }).catch((err) => {
            throw new OperationError(err.code, err.message)
        })

        if (typeof build === "function") {
            try {
                build = await build()

                const result = await RemoteUpload({
                    parentDir: req.auth.session.user_id,
                    source: build.filePath,
                    service: providerType,
                    useCompression: req.headers["use-compression"] ?? true,
                    cachePath: tmpPath,
                })

                fs.promises.rm(tmpPath, { recursive: true, force: true })

                return result
            } catch (error) {
                fs.promises.rm(tmpPath, { recursive: true, force: true })

                throw new OperationError(error.code ?? 500, error.message ?? "Failed to upload file")
            }
        }

        return {
            ok: 1
        }
    }
}