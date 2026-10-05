import type { WebRtcTransportDump } from "mediasoup/types"

export type SerializedCreateTransport = {
	id: string
	iceParameters: WebRtcTransportDump["iceParameters"]
	iceCandidates: WebRtcTransportDump["iceCandidates"]
	dtlsParameters: WebRtcTransportDump["dtlsParameters"]
}
