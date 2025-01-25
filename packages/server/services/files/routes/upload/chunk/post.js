import path from "path"
import fs from "fs"

import ChunkFileUpload from "@shared-classes/ChunkFileUpload"

import RemoteUpload from "@services/remoteUpload"

const availableProviders = ["b2", "standard"]

export default {
    useContext: ["cache", "limits"],
    middlewares: [
        "withAuthentication",
    ],
    fn: async (req, res) => {
        const tmpPath = path.resolve(this.default.contexts.cache.constructor.cachePath, req.auth.session.user_id)

        const limits = {
            maxFileSize: parseInt(this.default.contexts.limits.maxFileSizeInMB) * 1024 * 1024,
            maxChunkSize: parseInt(this.default.contexts.limits.maxChunkSizeInMB) * 1024 * 1024,
            useCompression: true,
            useProvider: "standard",
        }

        const user = await req.auth.user()

        if (user.roles.includes("admin")) {
            // maxFileSize for admins 100GB
            limits.maxFileSize = 100 * 1024 * 1024 * 1024

            // optional compression for admins
            limits.useCompression = req.headers["use-compression"] ?? false

            limits.useProvider = req.headers["provider-type"] ?? "b2"
        }

        // check if provider is valid
        if (!availableProviders.includes(limits.useProvider)) {
            throw new OperationError(400, "Invalid provider")
        }

        let build = await ChunkFileUpload(req, {
            tmpDir: tmpPath,
            ...limits,
        }).catch((err) => {
            throw new OperationError(err.code, err.message)
        })

        if (typeof build === "function") {
            try {
                build = await build()

                const result = await RemoteUpload({
                    parentDir: req.auth.session.user_id,
                    source: build.filePath,
                    service: limits.useProvider,
                    useCompression: limits.useCompression,
                    transmux: req.headers["transmux"] ?? false,
                    transmuxOptions: req.headers["transmux-options"],
                    cachePath: tmpPath,
                })

                await fs.promises.rm(tmpPath, { recursive: true, force: true }).catch(() => {
                    return false
                })

                return result
            } catch (error) {
                await fs.promises.rm(tmpPath, { recursive: true, force: true }).catch(() => {
                    return false
                })

                throw new OperationError(error.code ?? 500, error.message ?? "Failed to upload file")
            }
        }

        return {
            ok: 1,
            chunkNumber: req.headers["uploader-chunk-number"],
        }
    }
}