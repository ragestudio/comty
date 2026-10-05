import type { RtpCapabilities } from "mediasoup-client/types"
import type { Client } from "../client"

export type JoinChannelResult = {
	started_at: Date
	room: any
	channelId: string
	rtpCapabilities: RtpCapabilities
	clients: Client[]
	producers: any[]
}
