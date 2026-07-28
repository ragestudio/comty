import type { UploadTask } from "./task"

export function handleChunkError(
	this: UploadTask,
	chunkIndex: number,
	error: Error,
) {
	if (this.hasFatalError) return

	const retries = this.chunkRetries.get(chunkIndex) || 0

	if (retries < this.maxRetries) {
		this.chunkRetries.set(chunkIndex, retries + 1)

		console.warn(
			`[Task ${this.id}] Retrying chunk ${chunkIndex} (${retries + 1}/${this.maxRetries})`,
		)
		this.emit("chunk-retry", {
			chunkIndex,
			retriesLeft: this.maxRetries - (retries + 1),
		})

		setTimeout(() => {
			if (!this.hasFatalError && !this.paused) {
				this.pendingChunks.unshift(chunkIndex)
				this.processNext()
			}
		}, this.delayBeforeRetryMs)
	} else {
		this.hasFatalError = true
		this.stopProgressTicker()
		console.error(
			`[Task ${this.id}] Fatal error on chunk ${chunkIndex}. No more retries.`,
			error,
		)

		this.emit(
			"error",
			this.file,
			new Error(
				`Failed to upload chunk ${chunkIndex} after ${this.maxRetries} retries.`,
			),
		)
	}
}
