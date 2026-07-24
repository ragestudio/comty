import React from "react"
import humanReadable from "@tsmx/human-readable"
import parseTransportStats from "@cores/mediartc/utils/parseTransportStats"

import { Icons } from "@components/Icons"

function calculateLossRate(prev, current) {
	if (!prev || !current) return 0
	return (prev.packetsLost - current.packetsLost) / prev.packetsSent
}

function calculateBandwidthBytesPerSecond(prev, current) {
	if (!prev || !current) return 0

	const bytesNew = current.bytesSent + current.bytesReceived
	const bytesPrev = prev?.bytesSent + prev?.bytesReceived

	return bytesNew - bytesPrev
}

const VoiceChannelStats = ({ state }) => {
	const [sendStats, setSendStats] = React.useState(null)
	const [recvStats, setRecvStats] = React.useState(null)
	const [bandwidthBytesPerSecond, setBandwidthBytesPerSecond] =
		React.useState(0)
	const [combinedStats, setCombinedStats] = React.useState(null)
	const [lossRate, setLossRate] = React.useState(0)

	const processInterval = React.useRef(null)

	const sendTransport = React.useMemo(() => {
		return app.cores.mediartc.instance().sendTransport
	}, [state.channelId])
	const recvTransport = React.useMemo(() => {
		return app.cores.mediartc.instance().recvTransport
	}, [state.channelId])

	const remoteCandidate = React.useMemo(() => {
		if (
			!sendStats ||
			!sendStats?.selectedPair ||
			!sendStats?.remoteCandidates
		) {
			return null
		}

		return sendStats.remoteCandidates.find(
			(c) => c.id === sendStats.selectedPair.remoteCandidateId,
		)
	}, [sendStats])

	const processStats = async () => {
		const sendStatsParsed = parseTransportStats(await sendTransport.getStats())
		const recvStatsParsed = parseTransportStats(await recvTransport.getStats())

		const combined = {
			bytesSent: sendStatsParsed.bytesSent + recvStatsParsed.bytesSent,
			bytesReceived:
				sendStatsParsed.bytesReceived + recvStatsParsed.bytesReceived,
			packetsSent: sendStatsParsed.packetsSent + recvStatsParsed.packetsSent,
			packetsLost: sendStatsParsed.packetsLost + recvStatsParsed.packetsLost,
			packetsReceived:
				sendStatsParsed.packetsReceived + recvStatsParsed.packetsReceived,
		}

		console.log({ sendStatsParsed, recvStatsParsed, combined })

		setSendStats(sendStatsParsed)
		setRecvStats(recvStatsParsed)

		setCombinedStats((prev) => {
			setLossRate(calculateLossRate(prev, combined))
			setBandwidthBytesPerSecond(
				calculateBandwidthBytesPerSecond(prev, combined),
			)

			return combined
		})
	}

	React.useEffect(() => {
		processStats()
		processInterval.current = setInterval(processStats, 1000)
		return () => clearInterval(processInterval.current)
	}, [])

	if (!sendStats) {
		return null
	}

	return (
		<div className="connection-stats">
			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Info</p>
				<span>
					<Icons.Server /> Address: {remoteCandidate.address}:
					{remoteCandidate.port}/{remoteCandidate.protocol}
				</span>
			</div>

			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Latency</p>
				<span>
					<Icons.Wifi /> RTT: {sendStats.rttMs}ms
				</span>
			</div>

			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Bytes</p>
				<span>
					<Icons.Upload /> Send:{" "}
					{humanReadable.fromBytes(combinedStats.bytesSent, {})}
				</span>
				<span>
					<Icons.Download />
					Recv: {humanReadable.fromBytes(combinedStats.bytesReceived, {})}
				</span>
				<span>
					<Icons.Antenna />
					Bandwidth: {humanReadable.fromBytes(bandwidthBytesPerSecond, {})}/s
				</span>
			</div>

			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Packages</p>
				<span>
					<Icons.Upload />
					Send: {combinedStats.packetsSent}
				</span>
				<span>
					<Icons.Download />
					Recv: {combinedStats.packetsReceived}
				</span>
				<span>
					<Icons.CircleSlash />
					Loss: {combinedStats.packetsLost}
				</span>
				<span>
					<Icons.CircleSlash />
					Loss Rate: {lossRate}%
				</span>
			</div>

			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Send Transport</p>
				<span>State: {sendTransport.connectionState}</span>
				<span>Producers: {sendTransport._producers?.size}</span>
			</div>

			<div className="connection-stats__group">
				<p className="connection-stats__group__title">Recv Transport</p>
				<span>State: {recvTransport.connectionState}</span>
				<span>Consumers: {recvTransport._consumers?.size}</span>
			</div>
		</div>
	)
}

export default VoiceChannelStats
