import { EventBus } from "@ragestudio/vessel"

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

		if ((!file) instanceof File) {
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
			"chunk-size": splitChunkSize,
			"cache-control": "no-cache",
			connection: "keep-alive",
		}

		this.setupListeners()
		this.nextSend()

		console.debug("[Uploader] Created", {
			splitChunkSize: splitChunkSize,
			totalChunks: this.totalChunks,
			totalSize: file.size,
			fileName: file.name,
			fileType: file.type,
		})
	}

	_reader = new FileReader()
	events = new EventBus()

	setupListeners() {
		window.addEventListener(
			"online",
			() =>
				!this.offline &&
				((this.offline = false),
				this.events.emit("online"),
				this.nextSend()),
		)
		window.addEventListener(
			"offline",
			() => ((this.offline = true), this.events.emit("offline")),
		)
	}

	getFileUID(file) {
		return (
			Math.floor(Math.random() * 100000000) +
			Date.now() +
			file.size +
			"_tmp"
		)
	}

	loadChunk() {
		return new Promise((resolve) => {
			const start = this.chunkCount * this.splitChunkSize
			const end = Math.min(start + this.splitChunkSize, this.file.size)

			this._reader.onload = () => {
				resolve(
					new Blob([this._reader.result], {
						type: "application/octet-stream",
					}),
				)
			}
			this._reader.readAsArrayBuffer(this.file.slice(start, end))
		})
	}

	async sendChunk() {
		console.log(`[UPLOADER] Sending chunk ${this.chunkCount}`, {
			currentChunk: this.chunkCount,
			totalChunks: this.totalChunks,
			chunk: this.chunk,
		})

		try {
			const res = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					...this.headers,
					"uploader-chunk-number": this.chunkCount,
				},
				body: this.chunk,
			})

			return res
		} catch (error) {
			this.manageRetries()
		}
	}

	manageRetries() {
		if (++this.retriesCount < this.maxRetries) {
			setTimeout(() => this.nextSend(), this.delayBeforeRetry * 1000)

			this.events.emit("fileRetry", {
				message: `Retrying chunk ${this.chunkCount}`,
				chunk: this.chunkCount,
				retriesLeft: this.retries - this.retriesCount,
			})
		} else {
			this.events.emit("error", {
				message: `No more retries for chunk ${this.chunkCount}`,
			})
		}
	}

	async nextSend() {
		if (this.paused || this.offline) {
			return null
		}

		this.chunk = await this.loadChunk()

		try {
			const res = await this.sendChunk()

			if (![200, 201, 204].includes(res.status)) {
				// failed!!
				return this.manageRetries()
			}

			const data = await res.json()

			console.log(`[UPLOADER] Chunk ${this.chunkCount} sent`)

			this.chunkCount = this.chunkCount + 1

			if (this.chunkCount < this.totalChunks) {
				this.nextSend()
			}

			// check if is the last chunk, if so, handle sse events
			if (this.chunkCount === this.totalChunks) {
				if (data.sseChannelId || data.sseUrl) {
					this.waitOnSSE(data)
				} else {
					this.events.emit("finish", data)
				}
			}

			this.events.emit("progress", {
				percent: Math.round((100 / this.totalChunks) * this.chunkCount),
				state: "Uploading",
			})
		} catch (error) {
			this.events.emit("error", error)
		}
	}

	togglePause() {
		this.paused = !this.paused

		if (!this.paused) {
			return this.nextSend()
		}
	}

	waitOnSSE(data) {
		console.log(`[UPLOADER] Connecting to SSE channel >`, data.sseUrl)

		const eventSource = new EventSource(data.sseUrl)

		eventSource.onerror = (error) => {
			this.events.emit("error", error)
			eventSource.close()
		}

		eventSource.onopen = () => {
			console.log(`[UPLOADER] SSE channel opened`)
		}

		eventSource.onmessage = (event) => {
			// parse json
			const messageData = JSON.parse(event.data)

			console.log(`[UPLOADER] SSE Event >`, messageData)

			if (messageData.event === "done") {
				this.events.emit("finish", messageData.result)
				eventSource.close()
			}

			if (messageData.event === "error") {
				this.events.emit("error", messageData.result)
				eventSource.close()
			}

			if (messageData.state) {
				this.events.emit("progress", {
					percent: messageData.percent,
					state: messageData.state,
				})
			}
		}
	}
}
