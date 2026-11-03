import type { ParsedTransportStats } from "@comty/spaces-sdk/rtc"

import React from "react"
import { XStack, YStack } from "tamagui"

import AppText from "@/ui/Text"
import {
	parseTransportStats,
	rtcService,
	useRTCStore,
} from "@comty/spaces-sdk/rtc"

import { TRANSPORT_STATE_LABELS } from "./ConnectionStatus"

const BYTE_UNITS = ["B", "KB", "MB", "GB"]

function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

	const index = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		BYTE_UNITS.length - 1,
	)

	const value = bytes / 1024 ** index

	return `${value.toFixed(index === 0 ? 0 : 1)} ${BYTE_UNITS[index]}`
}

function getRemoteAddress(stats: ParsedTransportStats) {
	const pair = stats.selectedPair

	if (!pair) return null

	const candidate = stats.remoteCandidates.find(
		(item) => item.id === pair.remoteCandidateId,
	)

	if (!candidate) return null

	return `${candidate.address}:${candidate.port}/${candidate.protocol}`
}

type CombinedStats = {
	address: string | null
	rttMs: string | null
	bytesSent: number
	bytesReceived: number
	packetsReceived: number
	packetsLost: number
}

function combineStats(send: ParsedTransportStats, recv: ParsedTransportStats) {
	return {
		address: getRemoteAddress(send) ?? getRemoteAddress(recv),
		rttMs: send.rttMs ?? recv.rttMs,
		bytesSent: send.bytesSent + recv.bytesSent,
		bytesReceived: send.bytesReceived + recv.bytesReceived,
		packetsReceived: send.packetsReceived + recv.packetsReceived,
		packetsLost: send.packetsLost + recv.packetsLost,
	} satisfies CombinedStats
}

const StatRow = ({ label, value }: { label: string; value: string }) => (
	<XStack
		alignItems="center"
		justifyContent="space-between"
		gap={12}
	>
		<AppText
			fontSize={12}
			opacity={0.5}
		>
			{label}
		</AppText>
		<AppText
			fontSize={12}
			type="mono"
			numberOfLines={1}
			flexShrink={1}
			textAlign="right"
		>
			{value}
		</AppText>
	</XStack>
)

export const ConnectionStats = () => {
	const sendState = useRTCStore((store) => store.sendTransportState)
	const recvState = useRTCStore((store) => store.recvTransportState)

	const [stats, setStats] = React.useState<CombinedStats | null>(null)

	React.useEffect(() => {
		let active = true
		let busy = false

		const tick = async () => {
			if (busy) return

			busy = true

			try {
				const sendPromise = rtcService.transports.send?.getStats()
				const recvPromise = rtcService.transports.recv?.getStats()

				const [rawSend, rawRecv] = await Promise.all([
					sendPromise?.catch(() => null) ?? null,
					recvPromise?.catch(() => null) ?? null,
				])

				if (!active) return

				setStats(
					combineStats(
						parseTransportStats(rawSend),
						parseTransportStats(rawRecv),
					),
				)
			} finally {
				busy = false
			}
		}

		tick()

		const timer = setInterval(tick, 1000)

		return () => {
			active = false
			clearInterval(timer)
		}
	}, [])

	const totalPackets = (stats?.packetsReceived ?? 0) + (stats?.packetsLost ?? 0)
	const lossRate =
		stats && totalPackets > 0
			? ((stats.packetsLost / totalPackets) * 100).toFixed(1)
			: "0.0"

	return (
		<YStack gap={4}>
			<StatRow
				label="Transport"
				value={`send: ${
					TRANSPORT_STATE_LABELS[sendState] ?? sendState
				} · recv: ${TRANSPORT_STATE_LABELS[recvState] ?? recvState}`}
			/>
			<StatRow
				label="Address"
				value={stats?.address ?? "—"}
			/>
			<StatRow
				label="RTT"
				value={stats?.rttMs ? `${stats.rttMs} ms` : "—"}
			/>
			<StatRow
				label="Loss"
				value={`${stats?.packetsLost ?? 0} (${lossRate}%)`}
			/>
			<StatRow
				label="Traffic"
				value={`${formatBytes(stats?.bytesSent ?? 0)} sent · ${formatBytes(
					stats?.bytesReceived ?? 0,
				)} recv`}
			/>
		</YStack>
	)
}

export default ConnectionStats
