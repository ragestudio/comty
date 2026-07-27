import type { UploadPart, Multipart } from "."
import type {
	MultipartUploadCompletedResult,
	MultipartUploadStartResult,
} from "@comty/shared/types/multipart"

import MultipartUploadsModel from "@db/multipart_uploads"
import { UPLOAD_URL_EXPIRATION } from "."

export type StartMultipartParams = {
	user_id: string
	file_name: string
	file_size: number
	file_hash: string
	total_chunks: number
	mime_type: string
}

export default async function (
	this: Multipart,
	params: StartMultipartParams,
): Promise<MultipartUploadStartResult | MultipartUploadCompletedResult> {
	if (!params) throw new Error("params are required")
	if (!params.user_id) throw new Error("user_id is required")
	if (!params.file_hash) throw new Error("file_hash is required")
	if (!params.file_name) throw new Error("file_name is required")
	if (!params.file_size) throw new Error("file_size is required")
	if (!params.total_chunks) throw new Error("total_chunks is required")
	if (params.file_size > this.maxFilesizeInBytes)
		throw new Error("file size exceeds limit")

	let uploadId = null
	let uploadedParts: UploadPart[] = []

	const objectPath = `${params.user_id}/${params.file_hash}`
	const uploadEntry = await MultipartUploadsModel.findOne(
		{
			file_hash: params.file_hash,
			user_id: params.user_id,
		},
		{ raw: true },
	)

	if (uploadEntry) {
		if (uploadEntry.status === "COMPLETED") {
			return {
				status: "completed",
				...(await this.composeObjectData(
					objectPath,
					this.entryToStat(uploadEntry),
				)),
			}
		}

		uploadId = uploadEntry.upload_id
		uploadedParts = JSON.parse(uploadEntry.uploaded_parts || "[]")

		uploadedParts = uploadedParts.map((p: any) => ({
			PartNumber: p.part || p.partNumber,
			ETag: (p.etag || p.ETag).replace(/"/g, ""),
		}))
	} else {
		uploadId = await this.storageClient.initiateNewMultipartUpload(
			this.storageClient.defaultBucket,
			objectPath,
			{
				"content-type": params.mime_type ?? "application/octet-stream",
			},
		)
	}

	const urlPromises = Array.from(
		{ length: params.total_chunks },
		(_, index) => {
			const partNumber = index + 1

			return this.storageClient.presignedUrl(
				"PUT",
				this.storageClient.defaultBucket,
				objectPath,
				UPLOAD_URL_EXPIRATION,
				{
					uploadId: uploadId,
					partNumber: partNumber.toString(),
				},
			)
		},
	)

	const partUrls = await Promise.all(urlPromises)

	if (!uploadEntry) {
		const entry = MultipartUploadsModel.create({
			upload_id: uploadId,
			user_id: params.user_id,
			file_hash: params.file_hash,
			file_name: params.file_name,
			object_path: objectPath,
			status: "UPLOADING",
			created_at: new Date(),
		})

		await entry.save()
	}

	return {
		upload_id: uploadId,
		object_path: objectPath,
		part_urls: partUrls,
		uploaded_parts: uploadedParts,
	}
}
