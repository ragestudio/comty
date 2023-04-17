import Core from "evite/src/core"

export default class RemoteStorage extends Core {
    static namespace = "remoteStorage"
    static depends = ["api", "tasksQueue"]

    public = {
        uploadFile: this.uploadFile.bind(this),
    }

    async getFileHash(file) {
        const buffer = await file.arrayBuffer()
        const hash = await crypto.subtle.digest("SHA-256", buffer)
        const hashArray = Array.from(new Uint8Array(hash))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

        return hashHex
    }

    async uploadFile(file, callback, options = {}) {
        const CHUNK_SIZE = 5000000

        const fileHash = await this.getFileHash(file)
        const fileSize = file.size

        const chunks = Math.ceil(fileSize / CHUNK_SIZE)

        const uploadTasks = []

        for (let i = 0; i < chunks; i++) {
            const start = i * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, fileSize)

            const chunkData = file.slice(start, end)

            const uploadTask = async () => {
                const formData = new FormData()

                formData.append("file", chunkData, file.name)

                const response = await app.cores.api.customRequest({
                    ...options,
                    url: "/files/upload_chunk",
                    method: "POST",
                    headers: {
                        ...options.headers ?? {},
                        "file-size": fileSize,
                        "file-hash": fileHash,
                        "file-chunk-size": end - start,
                        "file-chunk-number": i,
                        "file-total-chunks": chunks,
                        "Content-Range": `bytes ${start}-${end - 1}/${fileSize}`,
                        "Content-Type": "multipart/form-data",
                    },
                    data: formData,
                })

                console.debug(`[Chunk Upload](${file.name})(${i}) Response >`, response.data)

                return response.data
            }

            uploadTasks.push(uploadTask)
        }

        const uploadChunksTask = async () => {
            try {
                let lastResponse = null

                for await (const task of uploadTasks) {
                    lastResponse = await task()
                }

                if (typeof callback === "function") {
                    callback(null, lastResponse)
                }

                return lastResponse
            } catch (error) {
                if (typeof callback === "function") {
                    callback(error, lastResponse)
                }

                throw error
            }
        }

        return new Promise((resolve, reject) => {
            app.cores.tasksQueue.appendToQueue(fileHash, async () => {
                try {
                    console.log(`Starting upload of file ${file.name}`)
                    console.log("fileHash", fileHash)
                    console.log("fileSize", fileSize)
                    console.log("chunks", chunks)

                    const result = await uploadChunksTask()

                    return resolve(result)
                } catch (error) {
                    return reject(error)
                }
            })
        })
    }

    async uploadFiles(files) {
        const results = []

        const promises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const callback = (error, result) => {
                    if (error) {
                        reject(error)
                    } else {
                        results.push({
                            name: file.name,
                            size: file.size,
                            result: result,
                        })
                        resolve()
                    }
                }
                app.cores.tasksQueue.appendToQueue(() => this.uploadFile(file, callback))
            })
        })

        await Promise.all(promises)

        return results
    }
}