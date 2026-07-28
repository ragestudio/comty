import type { UploadTask, UploadProgress } from "./task"

import { formatSpeed } from "../utils/format"

export function emitFullProgress(this: UploadTask) {
	this.emit("progress", this.file, {
		percent: 100,
		bytesUploaded: this.file.size,
		bytesRemaining: 0,
		totalBytes: this.file.size,
		speedBytesPerSec: 0,
		speedFormatted: "0 B/s",
		activeChunks: [],
		completedChunks: this.chunksNumber,
		totalChunks: this.chunksNumber,
	} as UploadProgress)
}

export function emitProgress(this: UploadTask, completedChunkIndex?: number) {
	let activeBytes = 0
	for (const bytes of this.activeChunkBytes.values()) {
		activeBytes += bytes
	}

	const totalUploaded = Math.min(
		this.file.size,
		this.completedBytesCount + activeBytes,
	)
	const bytesRemaining = Math.max(0, this.file.size - totalUploaded)
	const percent = Math.min(
		100,
		Number(((totalUploaded / this.file.size) * 100).toFixed(2)),
	)

	const currentActiveTimeMs =
		this.activeTimeMs +
		(this.lastResumeTimestamp > 0
			? Date.now() - this.lastResumeTimestamp
			: 0)
	const elapsedSeconds = currentActiveTimeMs / 1000
	const speedBytesPerSec =
		elapsedSeconds > 0 ? Math.round(totalUploaded / elapsedSeconds) : 0

	const progressData: UploadProgress = {
		percent,
		bytesUploaded: totalUploaded,
		bytesRemaining,
		totalBytes: this.file.size,
		speedBytesPerSec,
		speedFormatted: formatSpeed(speedBytesPerSec),
		activeChunks: Array.from(this.activeChunkBytes.keys()),
		completedChunks: this.completedChunks,
		totalChunks: this.chunksNumber,
		chunkIndex: completedChunkIndex,
	}

	this.emit("progress", this.file, progressData)
}
