import React, { useState, useRef, useCallback, useEffect } from "react"
import {
	Table,
	Tag,
	Card,
	Descriptions,
	Button,
	Row,
	Col,
	Statistic,
	message,
	Space,
} from "antd"
import {
	BarChartOutlined,
	PauseOutlined,
	CaretRightOutlined,
} from "@ant-design/icons"

function ConsumerStats({ consumerId, core }) {
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const prevRef = useRef(null)
	const intervalRef = useRef(null)

	const fetchStats = useCallback(async () => {
		if (!core?.consumers) return
		const consumer = core.consumers.get(consumerId)
		if (!consumer?.rtpReceiver) return

		setLoading(true)
		try {
			const rawStats = await consumer.rtpReceiver.getStats()
			const now = Date.now()
			const parsed = {
				timestamp: now,
				inbound: null,
				remoteInbound: null,
				candidatePair: null,
				track: null,
			}

			for (const report of rawStats.values()) {
				if (report.type === "inbound-rtp" && !report.isRemote) {
					parsed.inbound = {
						bytesReceived: report.bytesReceived,
						packetsReceived: report.packetsReceived,
						packetsLost: report.packetsLost,
						jitter: report.jitter,
						jitterMs: report.jitter
							? (report.jitter * 1000).toFixed(2)
							: null,
						kind: report.kind,
					}
				}
				if (report.type === "remote-inbound-rtp") {
					parsed.remoteInbound = {
						roundTripTime: report.roundTripTime,
						rttMs: report.roundTripTime
							? (report.roundTripTime * 1000).toFixed(1)
							: null,
						fractionLost: report.fractionLost,
						jitter: report.jitter,
					}
				}
				if (
					report.type === "candidate-pair" &&
					report.state === "succeeded"
				) {
					parsed.candidatePair = {
						currentRoundTripTime: report.currentRoundTripTime,
						rttMs: report.currentRoundTripTime
							? (report.currentRoundTripTime * 1000).toFixed(1)
							: null,
						availableOutgoingBitrate:
							report.availableOutgoingBitrate,
						availableIncomingBitrate:
							report.availableIncomingBitrate,
					}
				}
				if (report.type === "track") {
					parsed.track = {
						kind: report.kind,
						framesReceived: report.framesReceived,
						framesDropped: report.framesDropped,
						frameWidth: report.frameWidth,
						frameHeight: report.frameHeight,
					}
				}
			}

			if (parsed.inbound && prevRef.current) {
				const prev = prevRef.current
				const dt = (now - prev.timestamp) / 1000
				if (dt > 0 && parsed.inbound.bytesReceived != null) {
					parsed.inbound.bitrateBps =
						((parsed.inbound.bytesReceived -
							prev.inbound.bytesReceived) *
							8) /
						dt
					parsed.inbound.bitrateKbps = (
						parsed.inbound.bitrateBps / 1000
					).toFixed(1)
				}
			}

			prevRef.current = {
				timestamp: now,
				inbound: parsed.inbound
					? { bytesReceived: parsed.inbound.bytesReceived }
					: null,
			}

			setStats(parsed)
		} catch (err) {
			message.error(`Stats failed: ${err.message}`)
		} finally {
			setLoading(false)
		}
	}, [core, consumerId])

	useEffect(() => {
		fetchStats()

		if (autoRefresh) {
			intervalRef.current = setInterval(fetchStats, 1000)
		}

		return () => {
			clearInterval(intervalRef.current)
		}
	}, [autoRefresh, fetchStats])

	const formatBitrate = (bps) => {
		if (!bps && bps !== 0) return "N/A"
		if (bps < 1000) return `${bps} bps`
		if (bps < 1e6) return `${(bps / 1000).toFixed(1)} kbps`
		return `${(bps / 1e6).toFixed(1)} Mbps`
	}

	const formatBytes = (bytes) => {
		if (!bytes && bytes !== 0) return "N/A"
		if (bytes < 1000) return `${bytes} B`
		if (bytes < 1e6) return `${(bytes / 1000).toFixed(1)} KB`
		return `${(bytes / 1e6).toFixed(1)} MB`
	}

	const s = stats

	return (
		<div style={{ marginTop: 8, marginBottom: 8 }}>
			<Space
				size={4}
				style={{ marginBottom: 8 }}
			>
				<Button
					size="small"
					icon={<BarChartOutlined />}
					loading={loading}
					onClick={fetchStats}
				>
					{stats ? "Refresh" : "Fetch Stats"}
				</Button>
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
			</Space>

			{s && (
				<Row
					gutter={[8, 8]}
					style={{ marginBottom: 8 }}
				>
					{s.inbound?.bitrateKbps != null && (
						<Col span={8}>
							<Statistic
								title="Bitrate"
								value={s.inbound.bitrateKbps}
								suffix="kbps"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
					{s.remoteInbound?.rttMs != null && (
						<Col span={8}>
							<Statistic
								title="RTT"
								value={s.remoteInbound.rttMs}
								suffix="ms"
								valueStyle={{ fontSize: 14 }}
							/>
						</Col>
					)}
					{s.inbound?.packetsLost != null && (
						<Col span={8}>
							<Statistic
								title="Packets Lost"
								value={s.inbound.packetsLost}
								valueStyle={{
									fontSize: 14,
									color:
										s.inbound.packetsLost > 50
											? "var(--debug-inactive)"
											: undefined,
								}}
							/>
						</Col>
					)}
				</Row>
			)}

			{s && (
				<Descriptions
					size="small"
					column={2}
					bordered
				>
					{s.inbound && (
						<>
							<Descriptions.Item label="Total Received">
								{formatBytes(s.inbound.bytesReceived)}
							</Descriptions.Item>
							<Descriptions.Item label="Packets Received">
								{s.inbound.packetsReceived}
							</Descriptions.Item>
							<Descriptions.Item label="Jitter">
								{s.inbound.jitterMs} ms
							</Descriptions.Item>
							<Descriptions.Item label="Kind">
								<Tag>{s.inbound.kind}</Tag>
							</Descriptions.Item>
						</>
					)}
					{s.remoteInbound && (
						<>
							<Descriptions.Item label="Remote RTT">
								{s.remoteInbound.rttMs} ms
							</Descriptions.Item>
							<Descriptions.Item label="Fraction Lost">
								{s.remoteInbound.fractionLost != null
									? `${(s.remoteInbound.fractionLost * 100).toFixed(2)}%`
									: "N/A"}
							</Descriptions.Item>
						</>
					)}
					{s.candidatePair && (
						<>
							<Descriptions.Item label="ICE RTT">
								{s.candidatePair.rttMs} ms
							</Descriptions.Item>
							<Descriptions.Item label="Outgoing Bitrate">
								{formatBitrate(
									s.candidatePair.availableOutgoingBitrate,
								)}
							</Descriptions.Item>
						</>
					)}
					{s.track?.kind === "video" && (
						<>
							<Descriptions.Item label="Resolution">
								{s.track.frameWidth}x{s.track.frameHeight}
							</Descriptions.Item>
							<Descriptions.Item label="Frames">
								{s.track.framesReceived}
								{s.track.framesDropped > 0
									? ` (${s.track.framesDropped} dropped)`
									: ""}
							</Descriptions.Item>
						</>
					)}
				</Descriptions>
			)}
		</div>
	)
}

export default function ConsumersPanel({
	consumers,
	state,
	core,
	highlightConsumerId,
}) {
	const speakingIds = state.speakingConsumers || []
	const highlightRef = useRef(null)

	useEffect(() => {
		if (highlightConsumerId && highlightRef.current) {
			highlightRef.current.scrollIntoView({
				behavior: "smooth",
				block: "center",
			})
		}
	}, [highlightConsumerId])

	const columns = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
			width: 120,
			render: (id) => (
				<code
					ref={id === highlightConsumerId ? highlightRef : null}
					style={{
						fontSize: 11,
						background:
							id === highlightConsumerId
								? "var(--debug-active)"
								: undefined,
						padding:
							id === highlightConsumerId ? "1px 4px" : undefined,
						borderRadius:
							id === highlightConsumerId ? 3 : undefined,
					}}
				>
					{id?.slice(0, 12)}...
				</code>
			),
		},
		{
			title: "Kind",
			dataIndex: "kind",
			key: "kind",
			width: 60,
			render: (kind) => (
				<Tag color={kind === "video" ? "purple" : "blue"}>{kind}</Tag>
			),
		},
		{
			title: "Tag",
			key: "mediaTag",
			width: 100,
			render: (_, record) => (
				<Tag color="cyan">{record.appData?.mediaTag || "unknown"}</Tag>
			),
		},
		{
			title: "User",
			key: "userId",
			width: 100,
			render: (_, record) => (
				<code style={{ fontSize: 11 }}>
					{record.userId?.slice(0, 10)}...
				</code>
			),
		},
		{
			title: "Speaking",
			dataIndex: "isSpeaking",
			key: "isSpeaking",
			width: 80,
			render: (val, record) =>
				val || speakingIds.includes(record.id) ? (
					<Tag color="green">speaking</Tag>
				) : (
					<Tag>silent</Tag>
				),
		},
		{
			title: "Track",
			key: "trackState",
			width: 100,
			render: (_, record) => {
				if (!record.track) return <Tag>no track</Tag>
				return (
					<Tag
						color={
							record.track.readyState === "live" ? "green" : "red"
						}
					>
						{record.track.readyState}
					</Tag>
				)
			},
		},
		{
			title: "Status",
			key: "status",
			width: 80,
			render: (_, record) => {
				if (record.closed) return <Tag color="red">closed</Tag>
				if (record.paused) return <Tag color="orange">paused</Tag>
				return <Tag color="green">active</Tag>
			},
		},
	]

	const expandedRowRender = (record) => (
		<div>
			<Descriptions
				size="small"
				column={2}
				bordered
				style={{ marginBottom: 8 }}
			>
				<Descriptions.Item label="Consumer ID">
					<code>{record.id}</code>
				</Descriptions.Item>
				<Descriptions.Item label="Producer ID">
					<code>{record.producerId}</code>
				</Descriptions.Item>
				<Descriptions.Item label="Type">
					<Tag>{record.type}</Tag>
				</Descriptions.Item>
				{record.track && (
					<>
						<Descriptions.Item label="Track Label">
							{record.track.label}
						</Descriptions.Item>
						<Descriptions.Item label="Track ID">
							<code style={{ fontSize: 11 }}>
								{record.track.id}
							</code>
						</Descriptions.Item>
						<Descriptions.Item label="Enabled">
							<Tag color={record.track.enabled ? "green" : "red"}>
								{String(record.track.enabled)}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Muted">
							<Tag color={record.track.muted ? "red" : "green"}>
								{String(record.track.muted)}
							</Tag>
						</Descriptions.Item>
					</>
				)}
				<Descriptions.Item
					label="App Data"
					span={2}
				>
					<pre style={{ fontSize: 11, margin: 0 }}>
						{JSON.stringify(record.appData, null, 2)}
					</pre>
				</Descriptions.Item>
			</Descriptions>

			<ConsumerStats
				consumerId={record.id}
				core={core}
			/>
		</div>
	)

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title={`Consumers (${consumers.length})`}
				extra={
					<span>
						Speaking: <Tag color="green">{speakingIds.length}</Tag>
					</span>
				}
			>
				<Table
					dataSource={consumers}
					columns={columns}
					rowKey="id"
					size="small"
					pagination={false}
					expandable={{
						expandedRowRender,
						rowExpandable: () => true,
					}}
					scroll={{ x: 650 }}
				/>
			</Card>
		</div>
	)
}
