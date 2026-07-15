import React from "react"
import { Descriptions, Tag, Card, Statistic, Row, Col } from "antd"
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	LoadingOutlined,
} from "@ant-design/icons"

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
