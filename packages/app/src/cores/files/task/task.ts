import type { HashedFile } from "@comty/shared/types/files"
import type { UploadTaskInternals } from "./internals"
import type { MultipartUploadCompletedResult } from "@comty/shared/types/multipart"

import { EventEmitter } from "tseep/lib/ee-safe"
import { emitProgress, emitFullProgress } from "./progress"
import { uploadChunk } from "./chunk"
import { initializeUpload, completeUpload } from "./operations"
import { handleChunkError } from "./error"

export interface CompletedPart {
	PartNumber: number
	ETag: string
}

export type UploadProgress = {
	percent: number
	bytesUploaded: number
	bytesRemaining: number
	totalBytes: number
	speedBytesPerSec: number
	speedFormatted: string
	activeChunks: number[]
	completedChunks: number
	totalChunks: number
	chunkIndex?: number
}

export class UploadTask extends EventEmitter implements UploadTaskInternals {
	static get chunkSizeInKB() {
		return 8192
	}

	id: string
	file: HashedFile
	ready: boolean = false

	upload_id: string = ""
	object_path: string = ""
	part_urls: string[] = []

	custom_headers: Record<string, string> = {}

	completedParts: CompletedPart[] = []
	chunksNumber: number = 0
	result: MultipartUploadCompletedResult = null

	pendingChunks: number[] = []
	chunkRetries: Map<number, number> = new Map()

	completedChunks: number = 0
	activeUploads: number = 0

	concurrency: number = 3
	maxRetries: number = 3
	delayBeforeRetryMs: number = 3000

	paused: boolean = false
	hasFatalError: boolean = false

	activeChunkBytes: Map<number, number> = new Map()
	completedBytesCount: number = 0

	activeTimeMs: number = 0
	lastResumeTimestamp: number = 0
	jobId: string | null = null

	private progressTimer: ReturnType<typeof setInterval> | null = null

	constructor(file: HashedFile, headers?: Record<string, string>) {
		super()
		this.file = file
		this.id = crypto.randomUUID()

		if (!this.file.hash) {
			throw new Error("File not hashed.")
		}

		if (typeof headers === "object") {
			this.custom_headers = headers
		}

		if (this.websocket) {
			this.websocket.on("cloud-tasks:job", this.handleJobWebsocketEvent)

			this.on("finish", () => {
				this.websocket?.off(
					this.jobEventId,
					this.handleJobWebsocketEvent,
				)
			})
		}
	}

	get websocket() {
		return globalThis.__comty_shared_state?.ws?.sockets?.get("main") ?? null
	}

	get chunkSizeInBytes() {
		return UploadTask.chunkSizeInKB * 1024
	}

	get jobEventId() {
		return `job:${this.jobId}`
	}

	start = () => {
		if (this.result) {
			this.complete()
			return
		}

		if (!this.ready) {
			throw new Error("Task not ready. Call initialize first.")
		}

		if (this.hasFatalError) return

		this.paused = false
		this.startProgressTicker()
		this.processNext()
	}

	pause = () => {
		this.paused = true
		this.stopProgressTicker()
		this.emit("paused")
	}

	resume = () => {
		if (this.hasFatalError) return

		this.paused = false

		this.startProgressTicker()
		this.emit("resumed")
		this.processNext()
	}

	handleJobWebsocketEvent = (data) => {
		if (data.job_id !== this.jobId) return

		if (data.event === "done") {
			this.emit("finish", this.file, data.result)
		}

		if (data.event === "error") {
			this.emit("error", this.file, data.result)
		}

		if (data.state) {
			this.emit("progress", this.file, {
				percent: data.percent,
				state: data.state ?? "Pending",
			})
		}
	}

	startProgressTicker = () => {
		if (this.progressTimer) return
		this.lastResumeTimestamp = Date.now()
		this.progressTimer = setInterval(() => {
			this.emitProgress()
		}, 500)
	}

	stopProgressTicker = () => {
		if (this.progressTimer) {
			clearInterval(this.progressTimer)
			this.progressTimer = null
		}
		if (this.lastResumeTimestamp > 0) {
			this.activeTimeMs += Date.now() - this.lastResumeTimestamp
			this.lastResumeTimestamp = 0
		}
	}

	emitProgress = emitProgress.bind(this) as OmitThisParameter<
		typeof emitProgress
	>

	emitFullProgress = emitFullProgress.bind(this) as OmitThisParameter<
		typeof emitFullProgress
	>

	processNext = () => {
		if (this.paused || this.hasFatalError) return

		while (
			this.activeUploads < this.concurrency &&
			this.pendingChunks.length > 0
		) {
			const chunkIndex = this.pendingChunks.shift()!
			this.activeUploads++
			this.uploadChunk(chunkIndex)
		}
	}

	uploadChunk = uploadChunk.bind(this) as OmitThisParameter<
		typeof uploadChunk
	>

	handleChunkError = handleChunkError.bind(this) as OmitThisParameter<
		typeof handleChunkError
	>

	initialize = initializeUpload.bind(this) as OmitThisParameter<
		typeof initializeUpload
	>

	complete = completeUpload.bind(this) as OmitThisParameter<
		typeof completeUpload
	>
}
