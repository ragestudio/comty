export type SerializedProducer = {
	id: string
	producerId: string
	channelId: string
	groupId: string
	userId: string
	kind: string | null
	appData: any
}

export type ProducerAppData = {
	mediaTag?: MediaTag
}

export type MediaTag = "user-mic" | "user-cam" | "screen-video" | "screen-audio"
