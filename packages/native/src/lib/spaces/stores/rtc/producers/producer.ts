import { types as mediasoup } from "mediasoup-client"

export interface Producer extends mediasoup.Producer {
	id: string
	producerId: string
	remote?: boolean
	self?: boolean
	userId?: string
}

export default Producer
