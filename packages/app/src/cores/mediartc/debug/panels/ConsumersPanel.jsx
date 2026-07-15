import React from "react"
import { Table, Tag, Card, Descriptions } from "antd"

export default function ConsumersPanel({ consumers, state }) {
	const speakingIds = state.speakingConsumers || []

	const columns = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
			width: 120,
			render: (id) => (
				<code style={{ fontSize: 11 }}>{id?.slice(0, 12)}...</code>
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
		<Descriptions
			size="small"
			column={2}
			bordered
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
						<code style={{ fontSize: 11 }}>{record.track.id}</code>
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
