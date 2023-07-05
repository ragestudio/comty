import Core from "evite/src/core"
import EventBus from "evite/src/internals/eventBus"
import SessionModel from "models/session"

class ChunkedUpload {
    constructor(params) {
        this.endpoint = params.endpoint
        this.file = params.file
        this.headers = params.headers || {}
        this.postParams = params.postParams
        this.chunkSize = params.chunkSize || 1000000
        this.service = params.service ?? "default"
        this.retries = params.retries ?? app.cores.settings.get("uploader.retries") ?? 3
        this.delayBeforeRetry = params.delayBeforeRetry || 5

        this.start = 0
        this.chunk = null
        this.chunkCount = 0
        this.totalChunks = Math.ceil(this.file.size / this.chunkSize)
        this.retriesCount = 0
        this.offline = false
        this.paused = false

        this.headers["Authorization"] = SessionModel.token
        this.headers["uploader-original-name"] = encodeURIComponent(this.file.name)
        this.headers["uploader-file-id"] = this.uniqid(this.file)
        this.headers["uploader-chunks-total"] = this.totalChunks
        this.headers["provider-type"] = this.service

        this._reader = new FileReader()
        this.eventBus = new EventBus()

        this.validateParams()
        this.sendChunks()

        // restart sync when back online
        // trigger events when offline/back online
        window.addEventListener("online", () => {
            if (!this.offline) return

            this.offline = false
            this.eventBus.emit("online")
            this.sendChunks()
        })

        window.addEventListener("offline", () => {
            this.offline = true
            this.eventBus.emit("offline")
        })
    }

    on(event, fn) {
        this.eventBus.on(event, fn)
    }

    validateParams() {
        if (!this.endpoint || !this.endpoint.length) throw new TypeError("endpoint must be defined")
        if (this.file instanceof File === false) throw new TypeError("file must be a File object")
        if (this.headers && typeof this.headers !== "object") throw new TypeError("headers must be null or an object")
        if (this.postParams && typeof this.postParams !== "object") throw new TypeError("postParams must be null or an object")
        if (this.chunkSize && (typeof this.chunkSize !== "number" || this.chunkSize === 0)) throw new TypeError("chunkSize must be a positive number")
        if (this.retries && (typeof this.retries !== "number" || this.retries === 0)) throw new TypeError("retries must be a positive number")
        if (this.delayBeforeRetry && (typeof this.delayBeforeRetry !== "number")) throw new TypeError("delayBeforeRetry must be a positive number")
    }

    uniqid(file) {
        return Math.floor(Math.random() * 100000000) + Date.now() + this.file.size + "_tmp"
    }

    getChunk() {
        return new Promise((resolve) => {
            const length = this.totalChunks === 1 ? this.file.size : this.chunkSize * 1000 * 1000
            const start = length * this.chunkCount

            this._reader.onload = () => {
                this.chunk = new Blob([this._reader.result], { type: "application/octet-stream" })
                resolve()
            }

            this._reader.readAsArrayBuffer(this.file.slice(start, start + length))
        })
    }

    sendChunk() {
        const form = new FormData()

        // send post fields on last request
        if (this.chunkCount + 1 === this.totalChunks && this.postParams) Object.keys(this.postParams).forEach(key => form.append(key, this.postParams[key]))

        form.append("file", this.chunk)

        this.headers["uploader-chunk-number"] = this.chunkCount

        return fetch(this.endpoint, { method: "POST", headers: this.headers, body: form })
    }

    manageRetries() {
        if (this.retriesCount++ < this.retries) {
            setTimeout(() => this.sendChunks(), this.delayBeforeRetry * 1000)

            this.eventBus.emit("fileRetry", {
                message: `An error occured uploading chunk ${this.chunkCount}. ${this.retries - this.retriesCount} retries left`,
                chunk: this.chunkCount,
                retriesLeft: this.retries - this.retriesCount
            })

            return
        }

        this.eventBus.emit("error", {
            message: `An error occured uploading chunk ${this.chunkCount}. No more retries, stopping upload`
        })
    }

    sendChunks() {
        if (this.paused || this.offline) return

        this.getChunk()
            .then(() => this.sendChunk())
            .then((res) => {
                if (res.status === 200 || res.status === 201 || res.status === 204) {
                    if (++this.chunkCount < this.totalChunks) this.sendChunks()
                    else {
                        res.json().then((body) => {
                            this.eventBus.emit("finish", body)
                        })
                    }

                    const percentProgress = Math.round((100 / this.totalChunks) * this.chunkCount)

                    this.eventBus.emit("progress", {
                        percentProgress
                    })
                }

                // errors that might be temporary, wait a bit then retry
                else if ([408, 502, 503, 504].includes(res.status)) {
                    if (this.paused || this.offline) return

                    this.manageRetries()
                }

                else {
                    if (this.paused || this.offline) return

                    this.eventBus.emit("error", {
                        message: `An error occured uploading chunk ${this.chunkCount}. Server responded with ${res.status}`
                    })
                }
            })
            .catch((err) => {
                if (this.paused || this.offline) return

                console.error(err)

                // this type of error can happen after network disconnection on CORS setup
                this.manageRetries()
            })
    }

    togglePause() {
        this.paused = !this.paused

        if (!this.paused) {
            this.sendChunks()
        }
    }
}

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
            service = "default",
        } = {},
    ) {
        const apiEndpoint = app.cores.api.instance().instances.files.getUri()

        // TODO: get value from settings
        const chunkSize = 2 * 1000 * 1000 // 10MB

        return new Promise((_resolve, _reject) => {
            const fn = async () => new Promise((resolve, reject) => {
                const uploader = new ChunkedUpload({
                    endpoint: `${apiEndpoint}/upload/chunk`,
                    chunkSize: chunkSize,
                    file: file,
                    service: service,
                })

                uploader.on("error", ({ message }) => {
                    console.error("[Uploader] Error", message)

                    if (typeof onError === "function") {
                        onError(file, message)
                    }

                    reject(message)
                    _reject(message)
                })

                uploader.on("progress", ({ percentProgress }) => {
                    //console.debug(`[Uploader] Progress: ${percentProgress}%`)

                    if (typeof onProgress === "function") {
                        onProgress(file, percentProgress)
                    }
                })

                uploader.on("finish", (data) => {
                    console.debug("[Uploader] Finish", data)

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