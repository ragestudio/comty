import React, { useState, useEffect, useRef, useCallback } from "react"
import {
	Descriptions,
	Tag,
	Card,
	Statistic,
	Row,
	Col,
	Button,
	Space,
	Collapse,
} from "antd"
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	LoadingOutlined,
	PauseOutlined,
	CaretRightOutlined,
} from "@ant-design/icons"

function TransportStats({ core }) {
	const [stats, setStats] = useState(null)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const intervalRef = useRef(null)
	const prevRef = useRef(null)

	const fetchStats = useCallback(async () => {
		if (!core) return

		const parsed = {
			timestamp: Date.now(),
			send: null,
			recv: null,
		}

		try {
			if (core.sendTransport && !core.sendTransport.closed) {
				const raw = await core.sendTransport.getStats()
				parsed.send = parseTransportStats(raw, "send")
			}
		} catch (_e) {
			/* transport may not be ready */
		}

		try {
			if (core.recvTransport && !core.recvTransport.closed) {
				const raw = await core.recvTransport.getStats()
				parsed.recv = parseTransportStats(raw, "recv")
			}
		} catch (_e) {
			/* transport may not be ready */
		}

		// compute bitrate deltas
		if (prevRef.current) {
			const prev = prevRef.current
			const dt = (parsed.timestamp - prev.timestamp) / 1000
			if (dt > 0) {
				for (const dir of ["send", "recv"]) {
					const curr = parsed[dir]
					const prevDir = prev[dir]
					if (curr?.bytesSent != null && prevDir?.bytesSent != null) {
						curr.bitrateOutBps =
							((curr.bytesSent - prevDir.bytesSent) * 8) / dt
						curr.bitrateOutKbps = (
							curr.bitrateOutBps / 1000
						).toFixed(1)
					}
					if (
						curr?.bytesReceived != null &&
						prevDir?.bytesReceived != null
					) {
						curr.bitrateInBps =
							((curr.bytesReceived - prevDir.bytesReceived) * 8) /
							dt
						curr.bitrateInKbps = (curr.bitrateInBps / 1000).toFixed(
							1,
						)
					}
				}
			}
		}

		prevRef.current = {
			timestamp: parsed.timestamp,
			send: parsed.send
				? {
						bytesSent: parsed.send.bytesSent,
						bytesReceived: parsed.send.bytesReceived,
					}
				: null,
			recv: parsed.recv
				? {
						bytesSent: parsed.recv.bytesSent,
						bytesReceived: parsed.recv.bytesReceived,
					}
				: null,
		}

		setStats(parsed)
	}, [core])

	useEffect(() => {
		if (!core?.sendTransport && !core?.recvTransport) return

		fetchStats()

		if (autoRefresh) {
			intervalRef.current = setInterval(fetchStats, 1000)
		}

		return () => {
			clearInterval(intervalRef.current)
		}
	}, [autoRefresh, fetchStats, core?.sendTransport, core?.recvTransport])

	if (!core?.sendTransport && !core?.recvTransport) return null

	const formatBitrate = (bps) => {
		if (!bps && bps !== 0) return null
		if (bps < 1000) return `${bps} bps`
		if (bps < 1e6) return `${(bps / 1000).toFixed(1)} kbps`
		return `${(bps / 1e6).toFixed(1)} Mbps`
	}

	const formatBytes = (bytes) => {
		if (!bytes && bytes !== 0) return null
		if (bytes < 1000) return `${bytes} B`
		if (bytes < 1e6) return `${(bytes / 1000).toFixed(1)} KB`
		return `${(bytes / 1e6).toFixed(1)} MB`
	}

	const s = stats
	const hasAny = s?.send || s?.recv

	return (
		<Card
			size="small"
			title={
				<Space size={4}>
					<span>WebRTC Transport Stats</span>
				</Space>
			}
			extra={
				<Button
					size="small"
					icon={
						autoRefresh ? <PauseOutlined /> : <CaretRightOutlined />
					}
					onClick={() => setAutoRefresh((v) => !v)}
					type={autoRefresh ? "primary" : "default"}
				>
					{autoRefresh ? "Auto (1s)" : "Manual"}
				</Button>
			}
			style={{ marginBottom: 12 }}
		>
			{hasAny && (
				<Row
					gutter={[8, 8]}
					style={{ marginBottom: 8 }}
				>
					{s.send?.bitrateOutKbps != null && (
						<Col span={6}>
							<Statistic
								title="Send Bitrate"
								value={s.send.bitrateOutKbps}
								suffix="kbps"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
					{s.recv?.bitrateInKbps != null && (
						<Col span={6}>
							<Statistic
								title="Recv Bitrate"
								value={s.recv.bitrateInKbps}
								suffix="kbps"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
					{s.send?.rttMs != null && (
						<Col span={6}>
							<Statistic
								title="Send RTT"
								value={s.send.rttMs}
								suffix="ms"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
					{s.recv?.rttMs != null && (
						<Col span={6}>
							<Statistic
								title="Recv RTT"
								value={s.recv.rttMs}
								suffix="ms"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
				</Row>
			)}

			<Row gutter={[12, 0]}>
				<Col span={12}>
					<Descriptions
						size="small"
						column={1}
						bordered
						title="Send Transport"
					>
						{s?.send ? (
							<>
								<Descriptions.Item label="ICE State">
									<Tag
										color={
											s.send.iceState === "completed" ||
											s.send.iceState === "connected"
												? "green"
												: s.send.iceState === "failed"
													? "red"
													: "orange"
										}
									>
										{s.send.iceState}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="DTLS State">
									<Tag
										color={
											s.send.dtlsState === "connected"
												? "green"
												: "orange"
										}
									>
										{s.send.dtlsState}
									</Tag>
								</Descriptions.Item>
								{s.send.rttMs != null && (
									<Descriptions.Item label="RTT">
										{s.send.rttMs} ms
									</Descriptions.Item>
								)}
								{s.send.bytesSent != null && (
									<Descriptions.Item label="Bytes Sent">
										{formatBytes(s.send.bytesSent)}
									</Descriptions.Item>
								)}
								{s.send.packetsLost != null && (
									<Descriptions.Item label="Packets Lost (Send)">
										<Tag
											color={
												s.send.packetsLost > 10
													? "red"
													: "default"
											}
										>
											{s.send.packetsLost}
										</Tag>
									</Descriptions.Item>
								)}
							</>
						) : (
							<Descriptions.Item label="Status">
								<Tag>not available</Tag>
							</Descriptions.Item>
						)}
					</Descriptions>
				</Col>

				<Col span={12}>
					<Descriptions
						size="small"
						column={1}
						bordered
						title="Recv Transport"
					>
						{s?.recv ? (
							<>
								<Descriptions.Item label="ICE State">
									<Tag
										color={
											s.recv.iceState === "completed" ||
											s.recv.iceState === "connected"
												? "green"
												: s.recv.iceState === "failed"
													? "red"
													: "orange"
										}
									>
										{s.recv.iceState}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="DTLS State">
									<Tag
										color={
											s.recv.dtlsState === "connected"
												? "green"
												: "orange"
										}
									>
										{s.recv.dtlsState}
									</Tag>
								</Descriptions.Item>
								{s.recv.rttMs != null && (
									<Descriptions.Item label="RTT">
										{s.recv.rttMs} ms
									</Descriptions.Item>
								)}
								{s.recv.bytesReceived != null && (
									<Descriptions.Item label="Bytes Received">
										{formatBytes(s.recv.bytesReceived)}
									</Descriptions.Item>
								)}
								{s.recv.packetsLost != null && (
									<Descriptions.Item label="Packets Lost (Recv)">
										<Tag
											color={
												s.recv.packetsLost > 10
													? "red"
													: "default"
											}
										>
											{s.recv.packetsLost}
										</Tag>
									</Descriptions.Item>
								)}
							</>
						) : (
							<Descriptions.Item label="Status">
								<Tag>not available</Tag>
							</Descriptions.Item>
						)}
					</Descriptions>
				</Col>
			</Row>

			<Collapse
				size="small"
				ghost
				items={[
					s?.send && {
						key: "send-ice",
						label: "Send Transport — ICE / DTLS Details",
						children: <ICEDTLSDetails data={s.send} />,
					},
					s?.recv && {
						key: "recv-ice",
						label: "Recv Transport — ICE / DTLS Details",
						children: <ICEDTLSDetails data={s.recv} />,
					},
				].filter(Boolean)}
			/>

			{s?.send?.availableOutgoingBitrate != null && (
				<Descriptions
					size="small"
					column={2}
					bordered
					style={{ marginTop: 12 }}
					title="Bandwidth Estimation"
				>
					<Descriptions.Item label="Available Outgoing">
						{formatBitrate(s.send.availableOutgoingBitrate)}
					</Descriptions.Item>
					<Descriptions.Item label="Available Incoming">
						{formatBitrate(s.recv?.availableIncomingBitrate) ||
							"N/A"}
					</Descriptions.Item>
				</Descriptions>
			)}
		</Card>
	)
}

function ICEDTLSDetails({ data }) {
	if (!data) return null

	const formatCandidate = (c, i) => (
		<Descriptions.Item
			key={i}
			label={
				<Tag
					color={
						c.candidateType === "host"
							? "green"
							: c.candidateType === "srflx"
								? "blue"
								: c.candidateType === "relay"
									? "purple"
									: "default"
					}
				>
					{c.candidateType}
				</Tag>
			}
		>
			<code style={{ fontSize: 11 }}>
				{c.address}:{c.port} ({c.protocol?.toUpperCase()})
			</code>
		</Descriptions.Item>
	)

	return (
		<div style={{ padding: "4px 0" }}>
			<Descriptions
				size="small"
				column={1}
				bordered
				title="DTLS"
				style={{ marginBottom: 12 }}
			>
				<Descriptions.Item label="State">
					<Tag
						color={
							data.dtlsState === "connected" ? "green" : "orange"
						}
					>
						{data.dtlsState || "unknown"}
					</Tag>
				</Descriptions.Item>
				{data.dtlsCipher && (
					<Descriptions.Item label="Cipher">
						<code style={{ fontSize: 11 }}>{data.dtlsCipher}</code>
					</Descriptions.Item>
				)}
			</Descriptions>

			<Descriptions
				size="small"
				column={1}
				bordered
				title="ICE"
				style={{ marginBottom: 12 }}
			>
				<Descriptions.Item label="State">
					<Tag
						color={
							data.iceState === "completed" ||
							data.iceState === "connected"
								? "green"
								: data.iceState === "failed"
									? "red"
									: "orange"
						}
					>
						{data.iceState || "unknown"}
					</Tag>
				</Descriptions.Item>
				{data.selectedPair && (
					<>
						<Descriptions.Item label="Selected Pair">
							<code style={{ fontSize: 11 }}>
								local:{" "}
								{data.selectedPair.localCandidateId?.slice(
									0,
									8,
								)}
								... | remote:{" "}
								{data.selectedPair.remoteCandidateId?.slice(
									0,
									8,
								)}
								...
							</code>
						</Descriptions.Item>
						<Descriptions.Item label="Pair State">
							<Tag
								color={
									data.selectedPair.state === "succeeded"
										? "green"
										: "orange"
								}
							>
								{data.selectedPair.state}
								{data.selectedPair.nominated
									? " (nominated)"
									: ""}
							</Tag>
						</Descriptions.Item>
					</>
				)}
			</Descriptions>

			{data.localCandidates.length > 0 && (
				<Descriptions
					size="small"
					column={1}
					bordered
					title={`Local Candidates (${data.localCandidates.length})`}
					style={{ marginBottom: 12 }}
				>
					{data.localCandidates.map(formatCandidate)}
				</Descriptions>
			)}

			{data.remoteCandidates.length > 0 && (
				<Descriptions
					size="small"
					column={1}
					bordered
					title={`Remote Candidates (${data.remoteCandidates.length})`}
				>
					{data.remoteCandidates.map(formatCandidate)}
				</Descriptions>
			)}
		</div>
	)
}

function parseTransportStats(rawStats, direction) {
	const parsed = {
		bytesSent: null,
		bytesReceived: null,
		packetsSent: null,
		packetsReceived: null,
		packetsLost: null,
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

function ServerInfo({ core, state }) {
	const socket = core?.socket

	if (!socket) return null

	const connState = socket.connected
		? "connected"
		: socket.disconnected
			? "disconnected"
			: "connecting"

	return (
		<Descriptions
			bordered
			size="small"
			column={2}
			title="RTC Server Info"
			style={{ marginBottom: 12 }}
		>
			<Descriptions.Item label="Server URL">
				<code style={{ fontSize: 11 }}>
					{socket.io?.uri || core.constructor.wsUrl || "N/A"}
				</code>
			</Descriptions.Item>
			<Descriptions.Item label="Socket State">
				<Tag
					color={
						connState === "connected"
							? "green"
							: connState === "connecting"
								? "orange"
								: "red"
					}
				>
					{connState}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Socket ID">
				<code style={{ fontSize: 11 }}>{socket.id || "N/A"}</code>
			</Descriptions.Item>
			<Descriptions.Item label="Device Handler">
				<Tag>{core.device?.handlerName || "N/A"}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Send Transport">
				<Tag
					color={
						state.sendTransportState === "connected"
							? "green"
							: state.sendTransportState === "connecting"
								? "orange"
								: "red"
					}
				>
					{state.sendTransportState}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Recv Transport">
				<Tag
					color={
						state.recvTransportState === "connected"
							? "green"
							: state.recvTransportState === "connecting"
								? "orange"
								: "red"
					}
				>
					{state.recvTransportState}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Send Transport ID">
				<code style={{ fontSize: 11 }}>
					{core.sendTransport?.id || "N/A"}
				</code>
			</Descriptions.Item>
			<Descriptions.Item label="Recv Transport ID">
				<code style={{ fontSize: 11 }}>
					{core.recvTransport?.id || "N/A"}
				</code>
			</Descriptions.Item>
		</Descriptions>
	)
}

export default function StatusOverview({ state, core }) {
	const statusColor = state.isJoined
		? "var(--debug-active)"
		: state.isLoading
			? "var(--debug-loading)"
			: "var(--debug-inactive)"
	const statusText = state.isJoined
		? "Connected"
		: state.isLoading
			? "Loading..."
			: "Disconnected"

	const boolTag = (val, trueLabel, falseLabel) =>
		val ? (
			<Tag color="green">{trueLabel || "YES"}</Tag>
		) : (
			<Tag color="red">{falseLabel || "NO"}</Tag>
		)

	return (
		<div className="debug-panel">
			<Row
				gutter={[8, 8]}
				style={{ marginBottom: 12 }}
			>
				<Col span={6}>
					<Card size="small">
						<Statistic
							title="Status"
							value={statusText}
							valueStyle={{ color: statusColor, fontSize: 16 }}
							prefix={
								state.isLoading ? (
									<LoadingOutlined />
								) : state.isJoined ? (
									<CheckCircleOutlined />
								) : (
									<CloseCircleOutlined />
								)
							}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<Statistic
							title="Channel"
							value={state.channel?.name || "None"}
							valueStyle={{ fontSize: 14 }}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<Statistic
							title="Clients"
							value={state.clients?.length || 0}
							valueStyle={{ fontSize: 20 }}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card size="small">
						<Statistic
							title="Connected Since"
							value={
								state.connectedAt
									? new Date(
											state.connectedAt,
										).toLocaleTimeString()
									: "-"
							}
							valueStyle={{ fontSize: 14 }}
						/>
					</Card>
				</Col>
			</Row>

			<Descriptions
				bordered
				size="small"
				column={3}
				title="Voice States"
				style={{ marginBottom: 12 }}
			>
				<Descriptions.Item label="Muted">
					{boolTag(state.isMuted, "MUTED", "UNMUTED")}
				</Descriptions.Item>
				<Descriptions.Item label="Deafened">
					{boolTag(state.isDeafened, "DEAFENED", "UNDEAFENED")}
				</Descriptions.Item>
				<Descriptions.Item label="Speaking">
					{boolTag(state.isSpeaking, "SPEAKING", "SILENT")}
				</Descriptions.Item>
				<Descriptions.Item label="Producing Audio">
					{boolTag(state.isProducingAudio)}
				</Descriptions.Item>
				<Descriptions.Item label="Producing Screen">
					{boolTag(state.isProducingScreen)}
				</Descriptions.Item>
				<Descriptions.Item label="Producing Camera">
					{boolTag(state.isProducingCamera)}
				</Descriptions.Item>
				<Descriptions.Item label="Is DM">
					{boolTag(state.isDm)}
				</Descriptions.Item>
				<Descriptions.Item label="Speaking Consumers">
					<Tag color="blue">
						{state.speakingConsumers?.length || 0} active
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Remote Producers">
					<Tag color="blue">
						{state.remoteProducers?.length || 0} remote
					</Tag>
				</Descriptions.Item>
			</Descriptions>

			<TransportStats core={core} />

			<ServerInfo
				core={core}
				state={state}
			/>

			{state.channel && (
				<Descriptions
					bordered
					size="small"
					column={2}
					title="Channel Details"
				>
					<Descriptions.Item label="ID">
						<code>{state.channelId}</code>
					</Descriptions.Item>
					<Descriptions.Item label="Name">
						{state.channel.name}
					</Descriptions.Item>
					<Descriptions.Item label="Type">
						<Tag>{state.channel.type || "unknown"}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Group ID">
						<code>{state.channel.groupId}</code>
					</Descriptions.Item>
					{state.channel.encoding_params && (
						<Descriptions.Item
							label="Encoding Params"
							span={2}
						>
							<pre style={{ fontSize: 11, margin: 0 }}>
								{JSON.stringify(
									state.channel.encoding_params,
									null,
									2,
								)}
							</pre>
						</Descriptions.Item>
					)}
				</Descriptions>
			)}
		</div>
	)
}
