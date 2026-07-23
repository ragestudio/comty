import type { RTEClient } from "linebridge"

export type MediaChannelParams = {
	data: any
	channelId: string
	mediaCodecs?: any[]
}

export type RTCClient = RTEClient & {
	channel_id?: string
	transports?: Map<string, any>
	voiceState?: {
		muted: boolean
		deafen: boolean
	}
	self?: boolean
	staled?: boolean
}

export type ProducerInstance = {
	producer: any
	onProducerClose: () => Promise<void>
	closed?: boolean
}
