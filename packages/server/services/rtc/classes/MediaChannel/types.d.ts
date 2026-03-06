export type MediaChannelParams = {
	data: any
	channelId: string
	worker: any
	mediaCodecs?: any[]
}

export type RTCClient = RTEClient & {
	transports?: Map<string, any>
	voiceState?: {
		muted: boolean
		deafened: boolean
	}
	self?: Boolean
}

export type ProducerInstance = {
	producer: any
	onProducerClose: () => Promise<void>
	closed?: boolean
}
