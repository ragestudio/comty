export interface RTC_JoinPayload {
	is_dm?: boolean
	channel_id?: string
	group_id?: string
	[key: string]: any
}

export interface RTC_ChannelEventPayload {
	isDm?: boolean
	event?: string
	data?: any
}

export interface RTC_ConnectTransportPayload {
	transportId: string
	dtlsParameters: any
	isDm?: boolean
	[key: string]: any
}

export interface RTC_ConsumePayload {
	producerId: string
	transportId: string
	rtpCapabilities: any
	paused: boolean
	isDm?: boolean
	[key: string]: any
}

export interface RTC_ProducePayload {
	transportId: string
	kind: string
	rtpParameters: any
	isDm?: boolean
	[key: string]: any
}

export interface RTC_StopConsumePayload {
	consumer_id: string
}

export interface RTC_StopProducePayload {
	producerId: string
}

export interface RTC_LeavePayload {
	isDm?: boolean
	[key: string]: any
}

export interface RTC_SoundpadPayload {
	isDm?: boolean
	[key: string]: any
}
