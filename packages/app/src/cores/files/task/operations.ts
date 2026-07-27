import type { UploadTaskInternals } from "./internals"
import type {
	MultipartUploadCompletedResult,
	MultipartUploadStartResult,
} from "@comty/shared/types/multipart"

import request from "comty.js/request"

export async function initializeUpload(this: UploadTaskInternals) {
	this.chunksNumber = Math.ceil(this.file.size / this.chunkSizeInBytes)

	this.pendingChunks = Array.from({ length: this.chunksNumber }, (_, i) => i)

	const response = await request({
		method: "GET",
		url: "/upload/parts/url",
		headers: {
			...(this.custom_headers ?? {}),
			"uploader-file-hash": this.file.hash,
			"uploader-file-name": encodeURIComponent(this.file.name),
			"uploader-file-size": this.file.size.toString(),
			"uploader-file-chunks": this.chunksNumber.toString(),
			"uploader-file-mime": this.file.type,
		},
	})

	const result = response.data as MultipartUploadStartResult &
		MultipartUploadCompletedResult

	if (result.status && result.status === "completed") {
		this.result = result
		return
	}

	this.upload_id = response.data.upload_id
	this.object_path = response.data.object_path
	this.part_urls = response.data.part_urls
	this.ready = true
}

export async function completeUpload(this: UploadTaskInternals) {
	try {
		const response = await request({
			method: "POST",
			url: "/upload/parts/complete",
			data: {
				...(this.custom_headers ?? {}),
				file_hash: this.file.hash,
				upload_id: this.upload_id,
				object_path: this.object_path,
				parts: this.completedParts,
			},
		})

		this.emit("finish", this.file, response.data)
	} catch (error: any) {
		this.hasFatalError = true
		this.stopProgressTicker()
		console.error(
			`[Task ${this.id}] Error completing multipart upload:`,
			error,
		)
		this.emit(
			"error",
			this.file,
			new Error("Failed to complete upload on server."),
		)
	}
}
