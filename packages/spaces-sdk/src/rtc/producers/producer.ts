import type { types as mediasoup } from "mediasoup-client"
import type { ProducerAppData } from "@comty/shared/types/rtc/producer"

export interface Producer<
	T extends mediasoup.AppData = mediasoup.AppData,
> extends mediasoup.Producer<ProducerAppData & T> {
	id: string
	userId: string
	producerId: string
	remote?: boolean
	self?: boolean
	isSpeaking?: boolean
}

export default Producer
