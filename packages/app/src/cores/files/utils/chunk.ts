import type { HashedFile } from "@comty/shared/types/files"

export function getChunkSize(
	chunkIndex: number,
	chunkSizeInBytes: number,
	fileSize: number,
): number {
	const start = chunkIndex * chunkSizeInBytes
	const end = Math.min(start + chunkSizeInBytes, fileSize)

	return end - start
}

export function getChunkBlob(
	chunkIndex: number,
	chunkSizeInBytes: number,
	file: HashedFile,
): Blob {
	const start = chunkIndex * chunkSizeInBytes
	const end = Math.min(start + chunkSizeInBytes, file.size)

	return file.slice(start, end, "application/octet-stream")
}
