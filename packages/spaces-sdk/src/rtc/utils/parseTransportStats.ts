export interface TransportCandidate {
	id: string
	candidateType: string
	protocol: string
	address: string
	port: number
	priority: number
}

export interface ParsedTransportStats {
	bytesSent: number
	bytesReceived: number
	packetsSent: number
	packetsReceived: number
	packetsLost: number
	rttRaw: number | null
	rttMs: string | null
	iceState: string | null
	dtlsState: string | null
	availableOutgoingBitrate: number | null
	availableIncomingBitrate: number | null
	localCandidates: TransportCandidate[]
	remoteCandidates: TransportCandidate[]
	selectedPair: {
		localCandidateId: string
		remoteCandidateId: string
		state: string
		nominated: boolean
		priority: number
	} | null
	dtlsCipher: string | null
}

export default function parseTransportStats(
	rawStats?: RTCStatsReport | null | undefined,
): ParsedTransportStats {
	const parsed: ParsedTransportStats = {
		bytesSent: 0,
		bytesReceived: 0,
		packetsSent: 0,
		packetsReceived: 0,
		packetsLost: 0,
		rttRaw: null,
		rttMs: null,
		iceState: null,
		dtlsState: null,
		availableOutgoingBitrate: null,
		availableIncomingBitrate: null,
		localCandidates: [],
		remoteCandidates: [],
		selectedPair: null,
		dtlsCipher: null,
	}

	if (!rawStats) return parsed

	for (const report of rawStats.values()) {
		if (report.type === "transport") {
			parsed.bytesSent = report.bytesSent ?? 0
			parsed.bytesReceived = report.bytesReceived ?? 0
			parsed.packetsSent = report.packetsSent ?? 0
			parsed.packetsReceived = report.packetsReceived ?? 0
			parsed.dtlsState = report.dtlsState ?? null
			parsed.iceState = report.iceState || report.iceRole || null
			parsed.dtlsCipher = report.dtlsCipher || null
		}

		if (report.type === "candidate-pair") {
			if (report.state === "succeeded" || report.nominated) {
				parsed.rttRaw = report.currentRoundTripTime ?? null
				parsed.rttMs = report.currentRoundTripTime
					? (report.currentRoundTripTime * 1000).toFixed(1)
					: null
				parsed.availableOutgoingBitrate =
					report.availableOutgoingBitrate ?? null
				parsed.availableIncomingBitrate =
					report.availableIncomingBitrate ?? null
				parsed.selectedPair = {
					localCandidateId: report.localCandidateId,
					remoteCandidateId: report.remoteCandidateId,
					state: report.state,
					nominated: report.nominated,
					priority: report.priority,
				}
			}
		}

		if (report.type === "local-candidate") {
			parsed.localCandidates.push({
				id: report.id,
				candidateType: report.candidateType,
				protocol: report.protocol,
				address: report.address || report.ip,
				port: report.port,
				priority: report.priority,
			})
		}

		if (report.type === "remote-candidate") {
			parsed.remoteCandidates.push({
				id: report.id,
				candidateType: report.candidateType,
				protocol: report.protocol,
				address: report.address || report.ip,
				port: report.port,
				priority: report.priority,
			})
		}
	}

	// aggregate packet loss from inbound/outbound rtp
	for (const report of rawStats.values()) {
		if (report.type === "outbound-rtp" || report.type === "inbound-rtp") {
			parsed.packetsLost += report.packetsLost || 0
		}
	}

	return parsed
}
