import type { BucketItemStat } from "minio"
import type { StorageClient } from "@shared-classes/StorageClient"
import type { LimitsValues } from "@shared-classes/Limits"
import type { MultipartUploadCompletedResult } from "@comty/shared/types/multipart"

import { MultipartUpload } from "@db/multipart_uploads"
import completeHandler from "./complete"
import startHandler from "./start"

export const UPLOAD_URL_EXPIRATION = 24 * 60 * 60 // 24 hours

export interface UploadPart {
	PartNumber: number
	ETag: string
}

export class Multipart {
	limits: Partial<LimitsValues>

	constructor(
		protected storageClient: StorageClient,
		limits: Partial<LimitsValues>,
	) {
		if (!storageClient) throw new Error("StorageClient is required")
		this.limits = limits
	}

	get maxFilesizeInBytes() {
		return this.limits.maxFileSizeInMB * 1024 * 1024
	}

	start = startHandler.bind(this) as OmitThisParameter<typeof startHandler>
	complete = completeHandler.bind(this) as OmitThisParameter<
		typeof completeHandler
	>

	async composeObjectData(
		objectPath: string,
		stat?: BucketItemStat,
	): Promise<MultipartUploadCompletedResult | null> {
		if (!objectPath) return null

		if (!stat) {
			stat = await this.getObjectStatFromS3(objectPath)
		}

		return {
			object_path: objectPath,
			url: this.storageClient.composeRemoteURL(objectPath),
			stat: stat,
		}
	}

	async getObjectStatFromS3(
		objectPath: string,
	): Promise<BucketItemStat | null> {
		try {
			return await this.storageClient.statObject(
				this.storageClient.defaultBucket,
				objectPath,
			)
		} catch (error) {
			return null
		}
	}

	entryToStat = (entry: MultipartUpload): BucketItemStat => {
		return {
			size: Number(entry.file_size),
			etag: entry.etag,
			lastModified: entry.updated_at,
			metaData: JSON.parse(entry.metadata),
		}
	}
}

export default Multipart
