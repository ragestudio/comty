import type { BucketItemStat } from "./bucket"

export type MultipartUploadStartResult = {
	upload_id: string
	object_path: string
	part_urls: string[]
	uploaded_parts: { PartNumber: number; ETag: string }[]
}

export type MultipartUploadCompletedResult = {
	status?: string
	object_path: string
	url: string
	stat: BucketItemStat
}
