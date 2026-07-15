import React from "react"
import { Descriptions, Tag, Card, Empty } from "antd"

export default function TransportsPanel({ state, core }) {
	const sendState = state.sendTransportState || "closed"
	const recvState = state.recvTransportState || "closed"

	const stateColor = (s) => {
		switch (s) {
			case "connected":
				return "green"
			case "connecting":
				return "orange"
			case "failed":
				return "red"
			default:
				return "default"
		}
	}

	let deviceInfo = null
	let rtpCapabilities = null

	if (core?.device) {
		try {
			deviceInfo = {
				loaded: core.device.loaded,
				handlerName: core.device.handlerName,
			}
			rtpCapabilities = core.device.rtpCapabilities
		} catch (_e) {
			deviceInfo = { loaded: false, handlerName: "not loaded" }
		}
	}

	const transportInfo = (transport) => {
		if (!transport) return null
		return {
			id: transport.id,
			closed: transport.closed,
			direction: transport.direction,
			connectionState: transport.connectionState,
			appData: transport.appData,
			iceTransport: transport.iceTransport
				? {
						state: transport.iceTransport.state,
						role: transport.iceTransport.role,
					}
				: null,
			dtlsTransport: transport.dtlsTransport
				? {
						state: transport.dtlsTransport.state,
					}
				: null,
		}
	}

	const sendInfo = transportInfo(core?.sendTransport)
	const recvInfo = transportInfo(core?.recvTransport)

	return (
		<div className="debug-panel">
			{!core?.device ? (
				<Empty description="Device not loaded" />
			) : (
				<>
					<Descriptions
						bordered
						size="small"
						column={2}
						title="Mediasoup Device"
						style={{ marginBottom: 12 }}
					>
						<Descriptions.Item label="Loaded">
							<Tag color={deviceInfo?.loaded ? "green" : "red"}>
								{String(deviceInfo?.loaded)}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Handler">
							<Tag>{deviceInfo?.handlerName}</Tag>
						</Descriptions.Item>
						{rtpCapabilities && (
							<Descriptions.Item
								label="RTP Codecs"
								span={2}
							>
								<pre
									style={{
										fontSize: 11,
										margin: 0,
										maxHeight: 120,
										overflow: "auto",
									}}
								>
									{JSON.stringify(
										rtpCapabilities.codecs?.map((c) => ({
											mimeType: c.mimeType,
											clockRate: c.clockRate,
											channels: c.channels,
											kind: c.kind,
										})),
										null,
										2,
									)}
								</pre>
							</Descriptions.Item>
						)}
					</Descriptions>

					<Card
						size="small"
						title={
							<span>
								Send Transport{" "}
								<Tag color={stateColor(sendState)}>
									{sendState}
								</Tag>
							</span>
						}
						style={{ marginBottom: 12 }}
					>
						{sendInfo ? (
							<Descriptions
								size="small"
								column={2}
								bordered
							>
								<Descriptions.Item label="ID">
									<code>{sendInfo.id}</code>
								</Descriptions.Item>
								<Descriptions.Item label="Direction">
									<Tag>{sendInfo.direction}</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Connection State">
									<Tag
										color={stateColor(
											sendInfo.connectionState,
										)}
									>
										{sendInfo.connectionState}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Closed">
									<Tag
										color={
											sendInfo.closed ? "red" : "green"
										}
									>
										{String(sendInfo.closed)}
									</Tag>
								</Descriptions.Item>
								{sendInfo.iceTransport && (
									<>
										<Descriptions.Item label="ICE State">
											<Tag>
												{sendInfo.iceTransport.state}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label="ICE Role">
											<Tag>
												{sendInfo.iceTransport.role}
											</Tag>
										</Descriptions.Item>
									</>
								)}
								{sendInfo.dtlsTransport && (
									<Descriptions.Item label="DTLS State">
										<Tag>
											{sendInfo.dtlsTransport.state}
										</Tag>
									</Descriptions.Item>
								)}
								{sendInfo.appData && (
									<Descriptions.Item
										label="App Data"
										span={2}
									>
										<pre
											style={{ fontSize: 11, margin: 0 }}
										>
											{JSON.stringify(
												sendInfo.appData,
												null,
												2,
											)}
										</pre>
									</Descriptions.Item>
								)}
							</Descriptions>
						) : (
							<Empty description="Send transport not initialized" />
						)}
					</Card>

					<Card
						size="small"
						title={
							<span>
								Recv Transport{" "}
								<Tag color={stateColor(recvState)}>
									{recvState}
								</Tag>
							</span>
						}
					>
						{recvInfo ? (
							<Descriptions
								size="small"
								column={2}
								bordered
							>
								<Descriptions.Item label="ID">
									<code>{recvInfo.id}</code>
								</Descriptions.Item>
								<Descriptions.Item label="Direction">
									<Tag>{recvInfo.direction}</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Connection State">
									<Tag
										color={stateColor(
											recvInfo.connectionState,
										)}
									>
										{recvInfo.connectionState}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Closed">
									<Tag
										color={
											recvInfo.closed ? "red" : "green"
										}
									>
										{String(recvInfo.closed)}
									</Tag>
								</Descriptions.Item>
								{recvInfo.iceTransport && (
									<>
										<Descriptions.Item label="ICE State">
											<Tag>
												{recvInfo.iceTransport.state}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label="ICE Role">
											<Tag>
												{recvInfo.iceTransport.role}
											</Tag>
										</Descriptions.Item>
									</>
								)}
								{recvInfo.dtlsTransport && (
									<Descriptions.Item label="DTLS State">
										<Tag>
											{recvInfo.dtlsTransport.state}
										</Tag>
									</Descriptions.Item>
								)}
							</Descriptions>
						) : (
							<Empty description="Recv transport not initialized" />
						)}
					</Card>
				</>
			)}
		</div>
	)
}
