import type { WebRtcTransportDump } from "mediasoup/types"

export type SerializedConnectTransport = {
	transportId: string
	dtlsParameters: WebRtcTransportDump["dtlsParameters"]
	isDm?: boolean
	[key: string]: any
}
