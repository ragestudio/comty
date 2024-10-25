import { EventBus } from "vessel"

export default class ChunkedUpload {
    constructor(params) {
        const {
            endpoint,
            file,
            headers = {},
            splitChunkSize = 1024 * 1024 * 10,
            maxRetries = 3,
            delayBeforeRetry = 5,
        } = params

        if (!endpoint) {
            throw new Error("Missing endpoint")
        }

        if (!file instanceof File) {
            throw new Error("Invalid or missing file")
        }

        if (typeof headers !== "object") {
            throw new Error("Invalid headers")
        }

        if (splitChunkSize <= 0) {
            throw new Error("Invalid splitChunkSize")
        }

        this.chunkCount = 0
        this.retriesCount = 0

        this.splitChunkSize = splitChunkSize
        this.totalChunks = Math.ceil(file.size / splitChunkSize)

        this.maxRetries = maxRetries
        this.delayBeforeRetry = delayBeforeRetry
        this.offline = this.paused = false

        this.endpoint = endpoint
        this.file = file
        this.headers = {
            ...headers,
            "uploader-original-name": encodeURIComponent(file.name),
            "uploader-file-id": this.getFileUID(file),
            "uploader-chunks-total": this.totalChunks,
            "chunk-size": splitChunkSize
        }

        this.setupListeners()
        this.nextSend()

        console.debug("[Uploader] Created", {
            splitChunkSize: splitChunkSize,
            totalChunks: this.totalChunks,
            totalSize: file.size
        })
    }

    _reader = new FileReader()
    events = new EventBus()

    setupListeners() {
        window.addEventListener("online", () => !this.offline && (this.offline = false, this.events.emit("online"), this.nextSend()))
        window.addEventListener("offline", () => (this.offline = true, this.events.emit("offline")))
    }

    getFileUID(file) {
        return Math.floor(Math.random() * 100000000) + Date.now() + file.size + "_tmp"
    }

    loadChunk() {
        return new Promise((resolve) => {
            const start = this.chunkCount * this.splitChunkSize
            const end = Math.min(start + this.splitChunkSize, this.file.size)

            this._reader.onload = () => resolve(new Blob([this._reader.result], { type: "application/octet-stream" }))
            this._reader.readAsArrayBuffer(this.file.slice(start, end))
        })
    }

    async sendChunk() {
        const form = new FormData()

        form.append("file", this.chunk)

        this.headers["uploader-chunk-number"] = this.chunkCount

        try {
            const res = await fetch(
                this.endpoint,
                {
                    method: "POST",
                    headers: this.headers,
                    body: form
                })

            return res
        } catch (error) {
            this.manageRetries()
        }
    }

    manageRetries() {
        if (++this.retriesCount < this.maxRetries) {
            setTimeout(() => this.nextSend(), this.delayBeforeRetry * 1000)

            this.events.emit("fileRetry", { message: `Retrying chunk ${this.chunkCount}`, chunk: this.chunkCount, retriesLeft: this.retries - this.retriesCount })
        } else {
            this.events.emit("error", { message: `No more retries for chunk ${this.chunkCount}` })
        }
    }

    async nextSend() {
        if (this.paused || this.offline) {
            return null
        }

        this.chunk = await this.loadChunk()

        const res = await this.sendChunk()

        if ([200, 201, 204].includes(res.status)) {
            if (++this.chunkCount < this.totalChunks) {
                this.nextSend()
            } else {
                res.json().then((body) => this.events.emit("finish", body))
            }

            this.events.emit("progress", {
                percentProgress: Math.round((100 / this.totalChunks) * this.chunkCount)
            })
        } else if ([408, 502, 503, 504].includes(res.status)) {
            this.manageRetries()
        } else {
            res.json().then((body) => this.events.emit("error", { message: `[${res.status}] ${body.error ?? body.message}` }))
        }
    }

    togglePause() {
        this.paused = !this.paused

        if (!this.paused) {
            return this.nextSend()
        }
    }
}
