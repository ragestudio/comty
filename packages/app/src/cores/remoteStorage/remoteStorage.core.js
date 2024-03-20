import Core from "evite/src/core"

import ChunkedUpload from "./chunkedUpload"

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

    async uploadFile(
        file,
        {
            onProgress = () => { },
            onFinish = () => { },
            onError = () => { },
            service = "standard",
        } = {},
    ) {
        return await new Promise((_resolve, _reject) => {
            const fn = async () => new Promise((resolve, reject) => {
                const uploader = new ChunkedUpload({
                    endpoint: `${app.cores.api.client().mainOrigin}/upload/chunk`,
                    // TODO: get chunk size from settings
                    splitChunkSize: 5 * 1024 * 1024, // 5MB in bytes 
                    file: file,
                    service: service,
                })

                uploader.on("error", ({ message }) => {
                    this.console.error("[Uploader] Error", message)

                    app.cores.notifications.new({
                        title: "Could not upload file",
                        description: message
                    }, {
                        type: "error"
                    })

                    if (typeof onError === "function") {
                        onError(file, message)
                    }

                    reject(message)
                    _reject(message)
                })

                uploader.on("progress", ({ percentProgress }) => {
                    if (typeof onProgress === "function") {
                        onProgress(file, percentProgress)
                    }
                })

                uploader.on("finish", (data) => {
                    this.console.debug("[Uploader] Finish", data)

                    app.cores.notifications.new({
                        title: "File uploaded",
                    }, {
                        type: "success"
                    })

                    if (typeof onFinish === "function") {
                        onFinish(file, data)
                    }

                    resolve(data)
                    _resolve(data)
                })
            })

            app.cores.tasksQueue.appendToQueue(`upload_${file.name}`, fn)
        })
    }
}