import React from "react"
import { Table, Tag, Card, Descriptions } from "antd"

export default function ScreensPanel({ screens }) {
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
			title: "Consumers",
			key: "consumers",
			width: 80,
			render: (_, record) => (
				<Tag color="blue">{record.consumersIds?.length || 0}</Tag>
			),
		},
		{
			title: "Tracks",
			key: "tracks",
			render: (_, record) =>
				record.mediaTracks?.map((t, i) => (
					<Tag
						key={i}
						color={t.kind === "video" ? "purple" : "blue"}
					>
						{t.kind}:{t.readyState}
					</Tag>
				)),
		},
	]

	const expandedRowRender = (record) => (
		<Descriptions
			size="small"
			column={1}
			bordered
		>
			<Descriptions.Item label="User ID">
				<code>{record.userId}</code>
			</Descriptions.Item>
			<Descriptions.Item label="Consumer IDs">
				<pre style={{ fontSize: 11, margin: 0 }}>
					{JSON.stringify(record.consumersIds, null, 2)}
				</pre>
			</Descriptions.Item>
			<Descriptions.Item label="Media Tracks">
				<pre style={{ fontSize: 11, margin: 0 }}>
					{JSON.stringify(record.mediaTracks, null, 2)}
				</pre>
			</Descriptions.Item>
		</Descriptions>
	)

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title={`Active Screens (${screens.length})`}
			>
				{screens.length === 0 ? (
					<p style={{ color: "#888", textAlign: "center" }}>
						No active screen shares
					</p>
				) : (
					<Table
						dataSource={screens}
						columns={columns}
						rowKey="userId"
						size="small"
						pagination={false}
						expandable={{
							expandedRowRender,
							rowExpandable: () => true,
						}}
					/>
				)}
			</Card>
		</div>
	)
}
