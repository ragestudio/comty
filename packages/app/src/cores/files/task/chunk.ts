import type { UploadTask } from "./task"

import { getChunkSize, getChunkBlob } from "../utils/chunk"

export async function uploadChunk(this: UploadTask, chunkIndex: number) {
	const chunkBlob = getChunkBlob(chunkIndex, this.chunkSizeInBytes, this.file)
	const targetUrl = this.part_urls[chunkIndex]

	try {
		const rawEtag = await new Promise<string>((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open("PUT", targetUrl, true)

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					this.activeChunkBytes.set(chunkIndex, event.loaded)
				}
			}

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					const etag =
						xhr.getResponseHeader("ETag") ||
						xhr.getResponseHeader("etag")
					if (!etag) {
						reject(
							new Error(
								`Missing ETag header in response for chunk ${chunkIndex}`,
							),
						)
					} else {
						resolve(etag)
					}
				} else {
					reject(new Error(`HTTP Error ${xhr.status}`))
				}
			}

			xhr.onerror = () => reject(new Error("Network error during upload"))
			xhr.onabort = () => reject(new Error("Upload aborted"))

			xhr.send(chunkBlob)
		})

		this.completedParts.push({
			PartNumber: chunkIndex + 1,
			ETag: rawEtag.replace(/"/g, ""),
		})

		this.completedBytesCount += getChunkSize(
			chunkIndex,
			this.chunkSizeInBytes,
			this.file.size,
		)
		this.activeChunkBytes.delete(chunkIndex)
		this.completedChunks++
		this.activeUploads--

		this.emitProgress(chunkIndex)

		console.debug(
			`[Task ${this.id}] Chunk ${chunkIndex} sent. (${this.completedChunks}/${this.chunksNumber})`,
		)

		this.processNext()

		if (this.completedChunks === this.chunksNumber) {
			this.stopProgressTicker()
			this.emitFullProgress()
			await this.complete()
		}
	} catch (error: any) {
		this.activeUploads--
		this.activeChunkBytes.delete(chunkIndex)
		this.handleChunkError(chunkIndex, error)
	}
}
