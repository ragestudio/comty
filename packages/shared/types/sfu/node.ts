import type { TransportListenInfo } from "mediasoup/types"

export type SfuNodeListen = TransportListenInfo

export type SfuNodeRegisterPayload = {
	pid: string
	node_id: string
	hostname: string
	announced_ip: string
	listens: SfuNodeListen[]
	refName?: string
}

export type SfuNodeUnregisterPayload = {
	node_id: string
	pid?: string
	hostname?: string
}

export interface SfuNodeEventsContract {
	transport_closed: { transport_id: string }
	producer_closed: { producer_id: string }
	consumer_closed: { consumer_id: string }
}

export type SfuNodeEventName = keyof SfuNodeEventsContract

export type SfuNodeEventPayload<K extends SfuNodeEventName> =
	SfuNodeEventsContract[K]

export type SfuNodeNotification<K extends SfuNodeEventName = SfuNodeEventName> =
	{
		event: K
		data: SfuNodeEventPayload<K>
	}

export type SfuControlEvent = "node_register" | "node_unregister"

export type SfuControlMessage<K extends SfuControlEvent = SfuControlEvent> = {
	event: K
	data: K extends "node_register"
		? SfuNodeRegisterPayload
		: SfuNodeUnregisterPayload
}
