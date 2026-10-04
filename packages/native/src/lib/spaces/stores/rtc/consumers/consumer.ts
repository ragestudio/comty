import { types as mediasoup } from "mediasoup-client"

export interface Consumer extends mediasoup.Consumer {
	id: string
	producerId: string
	userId: string
	appData: {
		mediaTag: string
	}
	isSpeaking?: boolean
}

export default Consumer
