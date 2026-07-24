export default (rawStats: RTCStatsReport) => {
	const parsed = {
		bytesSent: null,
		bytesReceived: null,
		packetsSent: null,
		packetsReceived: null,
		packetsLost: null,
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

	for (const report of rawStats.values()) {
		if (report.type === "transport") {
			parsed.bytesSent = report.bytesSent
			parsed.bytesReceived = report.bytesReceived
			parsed.packetsSent = report.packetsSent
			parsed.packetsReceived = report.packetsReceived
			parsed.dtlsState = report.dtlsState
			parsed.iceState = report.iceState || report.iceRole
			parsed.dtlsCipher = report.dtlsCipher || null
		}
		if (report.type === "candidate-pair") {
			if (report.state === "succeeded" || report.nominated) {
				parsed.rttRaw = report.currentRoundTripTime
				parsed.rttMs = report.currentRoundTripTime
					? (report.currentRoundTripTime * 1000).toFixed(1)
					: null
				parsed.availableOutgoingBitrate =
					report.availableOutgoingBitrate
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
	let totalLost = 0
	for (const report of rawStats.values()) {
		if (report.type === "outbound-rtp" || report.type === "inbound-rtp") {
			totalLost += report.packetsLost || 0
		}
	}
	parsed.packetsLost = totalLost

	return parsed
}
