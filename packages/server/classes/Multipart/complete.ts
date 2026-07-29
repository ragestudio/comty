import type { Multipart } from "."
import type { MultipartUploadCompletedResult } from "@comty/shared/types/multipart"

import MultipartUploadsModel from "@db/multipart_uploads"

export type CompleteMultipartParams = {
	user_id: string
	file_hash: string
	upload_id: string
	object_path: string
	parts: Array<{ PartNumber: number; ETag: string }>
}

export default async function (
	this: Multipart,
	params: CompleteMultipartParams,
): Promise<MultipartUploadCompletedResult> {
	if (!params) throw new OperationError(400, "params are required")
	if (!params.user_id) throw new OperationError(400, "user_id is required")
	if (!params.file_hash)
		throw new OperationError(400, "file_hash is required")
	if (!params.upload_id)
		throw new OperationError(400, "upload_id is required")
	if (!params.object_path)
		throw new OperationError(400, "file_path is required")
	if (!Array.isArray(params.parts))
		throw new OperationError(400, "parts must be an array")

	const uploadId = params.upload_id
	const objectPath = params.object_path
	let uploadEntry = await MultipartUploadsModel.findOne(
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
	}

	const formattedParts = params.parts
		.sort((a, b) => a.PartNumber - b.PartNumber)
		.map((p) => ({
			part: p.PartNumber,
			etag: p.ETag,
		}))

	await this.storageClient.completeMultipartUpload(
		this.storageClient.defaultBucket,
		objectPath,
		uploadId,
		formattedParts,
	)

	let objectStat = await this.getObjectStatFromS3(objectPath)

	if (objectStat.size > this.maxFilesizeInBytes) {
		await this.storageClient.removeObject(
			this.storageClient.defaultBucket,
			objectPath,
		)

		throw new OperationError(413, "File size exceeds maximum allowed")
	}

	await MultipartUploadsModel.update(
		{
			status: "COMPLETED",
			user_id: params.user_id,
			file_hash: params.file_hash,
			file_size: objectStat.size,
			etag: objectStat.etag,
			uploaded_parts: JSON.stringify(formattedParts),
			metadata: JSON.stringify(objectStat.metaData),
			updated_at: new Date(),
		},
		{
			raw: true,
		},
	)

	uploadEntry = await MultipartUploadsModel.findOne(
		{
			file_hash: params.file_hash,
			user_id: params.user_id,
		},
		{ raw: true },
	)

	return {
		status: "completed",
		...(await this.composeObjectData(
			objectPath,
			this.entryToStat(uploadEntry),
		)),
	}
}
