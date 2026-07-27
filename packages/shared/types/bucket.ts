export interface BucketItemStat {
	size: number
	etag: string
	lastModified: Date
	metaData: ItemBucketMetadata
}

export interface ItemBucketMetadata {
	[key: string]: any
}
