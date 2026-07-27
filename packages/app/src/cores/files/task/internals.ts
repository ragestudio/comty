import type { HashedFile } from "@comty/shared/types/files"
import type { CompletedPart, UploadProgress } from "./task"

export interface UploadTaskInternals {
	emit(event: "progress", file: HashedFile, data: UploadProgress): void
	emit(event: "finish", file: HashedFile, result: any): void
	emit(event: "error", file: HashedFile, error: Error): void
	emit(event: "paused"): void
	emit(event: "resumed"): void
	emit(
		event: "chunk-retry",
		data: { chunkIndex: number; retriesLeft: number },
	): void
	emit(event: string, ...args: any[]): void
	readonly chunkSizeInBytes: number

	id: string
	file: HashedFile
	ready: boolean

	upload_id: string
	object_path: string
	part_urls: string[]

	custom_headers: Record<string, string>

	completedParts: CompletedPart[]

	chunksNumber: number
	result: any

	pendingChunks: number[]
	chunkRetries: Map<number, number>

	completedChunks: number
	activeUploads: number

	concurrency: number
	maxRetries: number
	delayBeforeRetryMs: number

	paused: boolean
	hasFatalError: boolean

	activeChunkBytes: Map<number, number>
	completedBytesCount: number

	activeTimeMs: number
	lastResumeTimestamp: number

	emitFullProgress(): void
	startProgressTicker(): void
	stopProgressTicker(): void
	processNext(): void
	uploadChunk(chunkIndex: number): Promise<void>
	handleChunkError(chunkIndex: number, error: Error): void
	emitProgress(completedChunkIndex?: number): void
	complete(): Promise<void>
}
