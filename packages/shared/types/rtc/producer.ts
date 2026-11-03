export type ProducerAppData = {
	mediaTag?: MediaTag
	childrens?: string[]
}

export type SerializedProducer = {
	id: string
	producerId: string
	channelId: string
	groupId: string
	userId: string
	kind: string | null
	appData: ProducerAppData
}

export type MediaTag = "user-mic" | "user-cam" | "screen-video" | "screen-audio"
