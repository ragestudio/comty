import type {
	AppData,
	ConsumerDump,
	DtlsParameters,
	MediaKind,
	Producer,
	RouterDump,
	RouterOptions,
	RtpCapabilities,
	RtpParameters,
	WebRtcTransportDump,
} from "mediasoup/types"

export type SfuCreateRouterPayload = RouterOptions & {
	channelId?: string
	groupId?: string
}

export type SfuGetRouterPayload = {
	router_id: string
}

export type SfuListRoutersPayload = undefined

export type SfuCloseRouterPayload = {
	id: string
}

export type SfuCreateTransportPayload = {
	router_id: string
}

export type SfuCanConsumePayload = {
	router_id: string
	producerId: string
	rtpCapabilities: RtpCapabilities
}

export type SfuConnectTransportPayload = {
	transport_id: string
	dtlsParameters: DtlsParameters
}

export type SfuProducePayload = {
	transport_id: string
	kind: MediaKind
	rtpParameters: RtpParameters
	appData?: AppData
}

export type SfuConsumePayload = {
	transport_id: string
	producerId: string
	rtpCapabilities: RtpCapabilities
	paused?: boolean
}

export type SfuCloseTransportPayload = {
	transport_id: string
}

export type SfuCloseProducerPayload = {
	producer_id: string
}

export type SfuCloseConsumerPayload = {
	consumer_id: string
}

export type SfuConsumerControlPayload = {
	consumer_id: string
	paused: boolean
}

export type SfuRequestKeyframePayload = {
	consumer_id: string
}

export type SfuRouterDump = RouterDump & {
	rtpCapabilities: RtpCapabilities
}

export type SfuRouterSummary = {
	id: string
	channelId?: string
	groupId?: string
}

export type SfuTransportDump = WebRtcTransportDump

export type SfuProducerResult = {
	id: string
	kind: Producer["kind"]
	rtpParameters: RtpParameters
	appData: AppData
}

export type SfuConsumerResult = {
	id: string
	producerId: string
	kind: MediaKind
	rtpParameters: RtpParameters
}

export type SfuConsumerDump = ConsumerDump

export type SfuCanConsumeResult = {
	canConsume: boolean
}

export type SfuSuccessResult = {
	success: boolean
}

export type SfuAliveResult = boolean

export type SfuListRoutersResult = SfuRouterSummary[]
