import type { MediaKind, RtpCapabilities } from "mediasoup/types"

export type IPC_RegisterNodePayload = {
	pid: string
	node_id: string
	hostname: string
	announced_ip: string
	listens: Record<string, any>[]
}

export type IPC_UnregisterNodePayload = {
	node_id: string
	pid?: string
	hostname?: string
}

export type IPC_CloseRouterPayload = {
	id: string
}

export type IPC_CreateRouterRTCTransportPayload = {
	router_id: string
}

export type IPC_RouterCanConsumePayload = {
	router_id: string
	producerId: string
	rtpCapabilities: RtpCapabilities
}

export type IPC_ConnectTransportPayload = {
	transport_id: string
	dtlsParameters: any
}

export type IPC_ProducePayload = {
	transport_id: string
	kind: MediaKind
	rtpParameters: any
	appData?: any
}

export type IPC_ConsumePayload = {
	transport_id: string
	producerId: string
	rtpCapabilities: RtpCapabilities
	paused?: boolean
}

export type IPC_CloseTransportPayload = {
	transport_id: string
}

export type IPC_CloseProducerPayload = {
	producer_id: string
}

export type IPC_CloseConsumerPayload = {
	consumer_id: string
}

export type IPC_RequestKeyFramePayload = {
	producer_id: string
}
