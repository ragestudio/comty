import type { types as mediasoup } from "mediasoup-client"
import type { MediaTag } from "@comty/shared/types/rtc/producer"

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
