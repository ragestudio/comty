import type { RTEClient } from "linebridge"
import * as mediasoup from "mediasoup"

export type MediaChannelParams = {
	data: any
	channelId: string
	worker: mediasoup.types.Worker
	webrtcServer: mediasoup.types.WebRtcServer
	mediaCodecs?: any[]
	controller?: any
}

export type RTCClient = RTEClient & {
	channel_id?: string
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
