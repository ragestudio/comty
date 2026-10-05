import { types as mediasoup } from "mediasoup-client"

export type MediaTag = "user-mic" | "screen-audio"

export interface Consumer extends mediasoup.Consumer {
	id: string
	producerId: string
	userId: string
	appData: {
		mediaTag: MediaTag
	}
	isSpeaking?: boolean
}

export default Consumer
