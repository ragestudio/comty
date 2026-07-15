import React from "react"
import { Table, Tag, Card, Descriptions } from "antd"

export default function ClientsPanel({ clients, core, consumers }) {
	const columns = [
		{
			title: "User ID",
			dataIndex: "userId",
			key: "userId",
			width: 140,
			render: (id) => (
				<code style={{ fontSize: 11 }}>{id?.slice(0, 14)}...</code>
			),
		},
		{
			title: "Self",
			dataIndex: "self",
			key: "self",
			width: 60,
			render: (val) =>
				val ? <Tag color="blue">self</Tag> : <Tag>remote</Tag>,
		},
		{
			title: "Voice Muted",
			key: "voiceMuted",
			width: 100,
			render: (_, record) =>
				record.voiceState?.muted ? (
					<Tag color="red">muted</Tag>
				) : (
					<Tag color="green">unmuted</Tag>
				),
		},
		{
			title: "Voice Deafened",
			key: "voiceDeafened",
			width: 100,
			render: (_, record) =>
				record.voiceState?.deafened ? (
					<Tag color="orange">deafened</Tag>
				) : (
					<Tag color="green">undeaf.</Tag>
				),
		},
		{
			title: "Mic Consumer",
			dataIndex: "micConsumerId",
			key: "micConsumerId",
			width: 120,
			render: (id) =>
				id ? (
					<code style={{ fontSize: 11 }}>{id?.slice(0, 12)}...</code>
				) : (
					<Tag>no mic</Tag>
				),
		},
		{
			title: "Consumers",
			key: "consumerCount",
			width: 80,
			render: (_, record) => {
				const count = consumers.filter(
					(c) => c.userId === record.userId,
				).length
				return <Tag color="blue">{count}</Tag>
			},
		},
	]

	const expandedRowRender = (record) => {
		const userConsumers = consumers.filter(
			(c) => c.userId === record.userId,
		)

		return (
			<Descriptions
				size="small"
				column={2}
				bordered
			>
				<Descriptions.Item
					label="User ID"
					span={2}
				>
					<code>{record.userId}</code>
				</Descriptions.Item>
				{record.voiceState && (
					<>
						<Descriptions.Item label="Voice Muted">
							<Tag
								color={
									record.voiceState.muted ? "red" : "green"
								}
							>
								{String(record.voiceState.muted)}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Voice Deafened">
							<Tag
								color={
									record.voiceState.deafened
										? "orange"
										: "green"
								}
							>
								{String(record.voiceState.deafened)}
							</Tag>
						</Descriptions.Item>
					</>
				)}
				<Descriptions.Item label="Mic Consumer ID">
					<code>{record.micConsumerId || "N/A"}</code>
				</Descriptions.Item>
				<Descriptions.Item label="Consumer Count">
					<Tag color="blue">{userConsumers.length}</Tag>
				</Descriptions.Item>
				{userConsumers.length > 0 && (
					<Descriptions.Item
						label="Consumer List"
						span={2}
					>
						<pre style={{ fontSize: 11, margin: 0 }}>
							{JSON.stringify(
								userConsumers.map((c) => ({
									id: c.id,
									kind: c.kind,
									tag: c.appData?.mediaTag,
									speaking: c.isSpeaking,
								})),
								null,
								2,
							)}
						</pre>
					</Descriptions.Item>
				)}
			</Descriptions>
		)
	}

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title={`Clients (${clients.length})`}
			>
				<Table
					dataSource={clients}
					columns={columns}
					rowKey="userId"
					size="small"
					pagination={false}
					expandable={{
						expandedRowRender,
						rowExpandable: () => true,
					}}
					scroll={{ x: 600 }}
				/>
			</Card>
		</div>
	)
}
