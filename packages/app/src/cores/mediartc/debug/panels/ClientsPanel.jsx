import React, { useState } from "react"
import {
	Table,
	Tag,
	Card,
	Descriptions,
	Button,
	Space,
	Popconfirm,
	Slider,
	message,
	Switch,
	Collapse,
} from "antd"

import { Icons } from "@components/Icons"

function getClientInstance(core, userId) {
	if (!core?.clients) return null
	return core.clients.get(userId)
}

export default function ClientsPanel({
	clients,
	core,
	consumers,
	onNavigateToConsumer,
}) {
	const [volumeValues, setVolumeValues] = useState({})

	const execAction = async (label, fn) => {
		try {
			await fn()
			message.success(`${label} done`)
		} catch (err) {
			message.error(`${label} failed: ${err.message}`)
		}
	}

	const handleKick = (userId) => {
		execAction("Kick", () =>
			core.socket.emit("channel:kick_client", { user_id: userId }),
		)
	}

	const handleServerMute = (userId, muted) => {
		execAction(muted ? "Server mute" : "Server unmute", () =>
			core.socket.emit("channel:client_event", {
				event: "updateVoiceState",
				data: { muted },
			}),
		)
	}

	const handleRestartConsumers = (userId) => {
		if (!core?.socket) return
		execAction("Restart consumers", () =>
			core.socket.call("channel:restart_client_consumers", {
				user_id: userId,
			}),
		)
	}

	const handleLocalMute = (userId) => {
		const client = getClientInstance(core, userId)
		if (!client) {
			message.error("Client instance not found")
			return
		}
		client.toggleMute()
		message.success(
			client.localState.muted ? "Local muted" : "Local unmuted",
		)
	}

	const handleLocalVolume = (userId, vol) => {
		setVolumeValues((prev) => ({ ...prev, [userId]: vol }))
		const client = getClientInstance(core, userId)
		if (client) {
			client.setVolume(vol)
		}
	}

	const columns = [
		{
			title: "User ID",
			dataIndex: "userId",
			key: "userId",
			width: 120,
			render: (id) => (
				<code style={{ fontSize: 11 }}>{id?.slice(0, 10)}...</code>
			),
		},
		{
			title: "Self",
			dataIndex: "self",
			key: "self",
			width: 50,
			render: (val) =>
				val ? (
					<Tag
						color="blue"
						style={{ margin: 0 }}
					>
						self
					</Tag>
				) : null,
		},
		{
			title: "Voice",
			key: "voiceState",
			width: 120,
			render: (_, record) => {
				const vs = record.voiceState || {}
				const tags = []
				if (vs.muted)
					tags.push(
						<Tag
							key="m"
							color="red"
						>
							muted
						</Tag>,
					)
				if (vs.deafen)
					tags.push(
						<Tag
							key="d"
							color="orange"
						>
							deaf
						</Tag>,
					)
				if (tags.length === 0)
					tags.push(
						<Tag
							key="ok"
							color="green"
						>
							ok
						</Tag>,
					)
				return <span>{tags}</span>
			},
		},
		{
			title: "Cons.",
			key: "consumerCount",
			width: 55,
			render: (_, record) => {
				const count = consumers.filter(
					(c) => c.userId === record.userId,
				).length
				return <Tag color="blue">{count}</Tag>
			},
		},
		{
			title: "Actions",
			key: "actions",
			width: 140,
			render: (_, record) => {
				if (record.self) return null

				const client = getClientInstance(core, record.userId)
				const localMuted = client?.localState?.muted ?? false

				return (
					<Space
						size={2}
						wrap
					>
						<Popconfirm
							title={`Kick ${record.userId?.slice(0, 8)}?`}
							onConfirm={() => handleKick(record.userId)}
						>
							<Button
								size="small"
								danger
								icon={<Icons.LogOut />}
							/>
						</Popconfirm>
						<Popconfirm
							title="Restart consumers?"
							onConfirm={() =>
								handleRestartConsumers(record.userId)
							}
						>
							<Button
								size="small"
								icon={<Icons.RefreshCcw />}
							/>
						</Popconfirm>
						<Button
							size="small"
							type={localMuted ? "primary" : "default"}
							danger={localMuted}
							icon={<Icons.Volume />}
							onClick={() => handleLocalMute(record.userId)}
						/>
					</Space>
				)
			},
		},
	]

	const expandedRowRender = (record) => {
		const userConsumers = consumers.filter(
			(c) => c.userId === record.userId,
		)
		const client = getClientInstance(core, record.userId)
		const curVol =
			volumeValues[record.userId] ??
			Math.round((client?.localState?.volume ?? 1) * 100)

		const userProducers = []
		if (core?.producers) {
			for (const [, p] of core.producers) {
				if (p.userId === record.userId) {
					userProducers.push({
						id: p.id,
						kind: p.kind,
						tag: p.appData?.mediaTag,
						paused: p.paused,
						closed: p.closed,
					})
				}
			}
		}

		return (
			<div style={{ padding: "4px 0" }}>
				<Descriptions
					size="small"
					column={2}
					bordered
					style={{ marginBottom: 12 }}
				>
					<Descriptions.Item
						label="User ID"
						span={2}
					>
						<code>{record.userId}</code>
					</Descriptions.Item>
					{record.voiceState && (
						<>
							<Descriptions.Item label="Server Muted">
								<Switch
									size="small"
									checked={record.voiceState.muted}
									onChange={(v) =>
										handleServerMute(record.userId, v)
									}
									disabled={record.self}
								/>
							</Descriptions.Item>
							<Descriptions.Item label="Local Muted">
								<Tag
									color={
										client?.localState?.muted
											? "red"
											: "green"
									}
								>
									{String(client?.localState?.muted ?? false)}
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
					<Descriptions.Item
						label={`Local Volume (${curVol}%)`}
						span={2}
					>
						<Slider
							min={0}
							max={200}
							step={5}
							value={curVol}
							onChange={(v) =>
								handleLocalVolume(record.userId, v)
							}
							style={{ width: "100%" }}
						/>
					</Descriptions.Item>
				</Descriptions>

				{userProducers.length > 0 && (
					<Descriptions
						size="small"
						column={1}
						bordered
						title={`Producers (${userProducers.length})`}
						style={{ marginBottom: 12 }}
					>
						{userProducers.map((p, i) => (
							<Descriptions.Item
								key={i}
								label={
									<Tag
										color={
											p.kind === "video"
												? "purple"
												: "blue"
										}
									>
										{p.tag || p.kind}
									</Tag>
								}
							>
								<code style={{ fontSize: 11 }}>{p.id}</code>
								{p.paused && (
									<Tag
										color="orange"
										style={{ marginLeft: 4 }}
									>
										paused
									</Tag>
								)}
								{p.closed && (
									<Tag
										color="red"
										style={{ marginLeft: 4 }}
									>
										closed
									</Tag>
								)}
							</Descriptions.Item>
						))}
					</Descriptions>
				)}

				{userConsumers.length > 0 && (
					<Collapse
						size="small"
						items={[
							{
								key: "consumers",
								label: `Consumers (${userConsumers.length})`,
								children: (
									<div>
										{userConsumers.map((c, i) => (
											<div
												key={i}
												style={{
													marginBottom: 12,
													borderBottom:
														"1px solid var(--border-color)",
													paddingBottom: 8,
												}}
											>
												<Descriptions
													size="small"
													column={3}
													bordered
												>
													<Descriptions.Item label="ID">
														<code
															style={{
																fontSize: 11,
															}}
														>
															{c.id?.slice(0, 12)}
															...
														</code>
													</Descriptions.Item>
													<Descriptions.Item label="Tag">
														<Tag
															color={
																c.kind ===
																"video"
																	? "purple"
																	: "blue"
															}
														>
															{c.appData
																?.mediaTag ||
																c.kind}
														</Tag>
													</Descriptions.Item>
													<Descriptions.Item label="Status">
														{c.closed ? (
															<Tag color="red">
																closed
															</Tag>
														) : c.paused ? (
															<Tag color="orange">
																paused
															</Tag>
														) : c.isSpeaking ? (
															<Tag color="green">
																speaking
															</Tag>
														) : (
															<Tag>active</Tag>
														)}
													</Descriptions.Item>
													<Descriptions.Item label="Producer ID">
														<code
															style={{
																fontSize: 11,
															}}
														>
															{c.producerId?.slice(
																0,
																12,
															)}
															...
														</code>
													</Descriptions.Item>
													<Descriptions.Item label="Track">
														{c.track ? (
															<Tag
																color={
																	c.track
																		.readyState ===
																	"live"
																		? "green"
																		: "red"
																}
															>
																{
																	c.track
																		.readyState
																}
															</Tag>
														) : (
															<Tag>none</Tag>
														)}
													</Descriptions.Item>
													<Descriptions.Item label="Kind">
														<Tag>{c.kind}</Tag>
													</Descriptions.Item>
												</Descriptions>

												<Button
													size="small"
													icon={<Icons.Link />}
													onClick={() =>
														onNavigateToConsumer?.(
															c.id,
														)
													}
													style={{ marginTop: 8 }}
												>
													View in Consumers tab
												</Button>
											</div>
										))}
									</div>
								),
							},
						]}
					/>
				)}
			</div>
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
