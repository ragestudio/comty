import EventBus from "evite/src/internals/eventBus"
import SessionModel from "models/session"

export default class ChunkedUpload {
    constructor(params) {
        this.endpoint = params.endpoint
        this.file = params.file
        this.headers = params.headers || {}
        this.postParams = params.postParams
        this.service = params.service ?? "default"
        this.retries = params.retries ?? app.cores.settings.get("uploader.retries") ?? 3
        this.delayBeforeRetry = params.delayBeforeRetry || 5

        this.start = 0
        this.chunk = null
        this.chunkCount = 0

        this.splitChunkSize = params.splitChunkSize || 1024 * 1024 * 10
        this.totalChunks = Math.ceil(this.file.size / this.splitChunkSize)

        this.retriesCount = 0
        this.offline = false
        this.paused = false

        this.headers["Authorization"] = `Bearer ${SessionModel.token}`
        this.headers["uploader-original-name"] = encodeURIComponent(this.file.name)
        this.headers["uploader-file-id"] = this.uniqid(this.file)
        this.headers["uploader-chunks-total"] = this.totalChunks
        this.headers["provider-type"] = this.service
        this.headers["chunk-size"] = this.splitChunkSize

        this._reader = new FileReader()
        this.eventBus = new EventBus()

        this.validateParams()
        this.nextSend()

        console.debug("[Uploader] Created", {
            splitChunkSize: this.splitChunkSize,
            totalChunks: this.totalChunks,
            totalSize: this.file.size,
        })

        // restart sync when back online
        // trigger events when offline/back online
        window.addEventListener("online", () => {
            if (!this.offline) return

            this.offline = false
            this.eventBus.emit("online")
            this.nextSend()
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
        if (this.splitChunkSize && (typeof this.splitChunkSize !== "number" || this.splitChunkSize === 0)) throw new TypeError("splitChunkSize must be a positive number")
        if (this.retries && (typeof this.retries !== "number" || this.retries === 0)) throw new TypeError("retries must be a positive number")
        if (this.delayBeforeRetry && (typeof this.delayBeforeRetry !== "number")) throw new TypeError("delayBeforeRetry must be a positive number")
    }

    uniqid(file) {
        return Math.floor(Math.random() * 100000000) + Date.now() + this.file.size + "_tmp"
    }

    loadChunk() {
        return new Promise((resolve) => {
            const length = this.totalChunks === 1 ? this.file.size : this.splitChunkSize
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
            setTimeout(() => this.nextSend(), this.delayBeforeRetry * 1000)

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

    async nextSend() {
        if (this.paused || this.offline) {
            return
        }

        await this.loadChunk()
        const res = await this.sendChunk()
            .catch((err) => {
                if (this.paused || this.offline) return

                this.console.error(err)

                // this type of error can happen after network disconnection on CORS setup
                this.manageRetries()
            })

        if (res.status === 200 || res.status === 201 || res.status === 204) {
            if (++this.chunkCount < this.totalChunks) {
                this.nextSend()
            } else {
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

            try {
                res.json().then((body) => {
                    this.eventBus.emit("error", {
                        message: `[${res.status}] ${body.error ?? body.message}`
                    })
                })
            } catch (error) {
                this.eventBus.emit("error", {
                    message: `[${res.status}] ${res.statusText}`
                })
            }
        }
    }

    togglePause() {
        this.paused = !this.paused

        if (!this.paused) {
            this.nextSend()
        }
    }
}