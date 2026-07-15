import React, { useState, useEffect } from "react"
import { Descriptions, Tag, Card, Statistic, Row, Col, Empty } from "antd"

export default function AudioPipeline({ core }) {
	const [audioInfo, setAudioInfo] = useState(null)
	const [tick, setTick] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			if (!core) return
			const self = core.self
			if (!self) return

			const info = {
				hasMicStream: !!self.micStream,
				micStreamTracks: self.micStream
					? self.micStream.getTracks().map((t) => ({
							kind: t.kind,
							readyState: t.readyState,
							enabled: t.enabled,
							muted: t.muted,
							label: t.label,
							settings: t.getSettings?.(),
						}))
					: [],
				hasMicProducer: !!self.micProducer,
				micProducerId: self.micProducer?.id,
				micProducerClosed: self.micProducer?.closed,

				hasAudioInput: !!self.audioInput,
				audioInputContext: self.audioInput
					? {
							state: self.audioInput.context?.state,
							sampleRate: self.audioInput.context?.sampleRate,
							baseLatency: self.audioInput.context?.baseLatency,
							outputLatency:
								self.audioInput.context?.outputLatency,
						}
					: null,
				audioInputMainGain: self.audioInput?.mainNode?.gain?.value,
				hasVolumeGate: !!self.audioInput?.volumeGateProcessor,
				hasNoiseSuppression:
					!!self.audioInput?.noiseSuppresionProcessor,

				hasAudioOutput: !!self.audioOutput,
				audioOutputContext: self.audioOutput?.context
					? {
							state: self.audioOutput.context.state,
							sampleRate: self.audioOutput.context.sampleRate,
							baseLatency: self.audioOutput.context.baseLatency,
							outputLatency:
								self.audioOutput.context.outputLatency,
						}
					: null,
				audioOutputMainGain: self.audioOutput?.mainNode?.gain?.value,

				hasSysAudio: !!self.sysAudio,
				sysAudioReady: self.sysAudio?.isReadyForFrames,
				sysAudioInputCtx: self.sysAudio?.inputCtx
					? {
							state: self.sysAudio.inputCtx.state,
							sampleRate: self.sysAudio.inputCtx.sampleRate,
						}
					: null,
				sysAudioOutputCtx: self.sysAudio?.outputCtx
					? {
							state: self.sysAudio.outputCtx.state,
							sampleRate: self.sysAudio.outputCtx.sampleRate,
						}
					: null,
				sysAudioOutputBusGain: self.sysAudio?.outputBus?.gain?.value,
				sysAudioHasOutput: !!self.sysAudio?.outputBus,

				hasCamStream: !!self.camStream,
				hasCamProducer: !!self.camProducer,

				hasScreenStream: !!self.screenStream,
				hasScreenProducer: !!self.screenProducer,
				hasScreenAudioProducer: !!self.screenAudioProducer,

				micWorkerExists: !!core.rtpMicWorker,

				inputDeviceId: core.self?.constructor?.inputDeviceId || "N/A",
				outputDeviceId: core.self?.constructor?.outputDeviceId || "N/A",
				audioSettings: self.audioSettings,
			}

			setAudioInfo(info)
			setTick((t) => t + 1)
		}, 1000)

		return () => clearInterval(interval)
	}, [core])

	const boolTag = (val) =>
		val ? <Tag color="green">YES</Tag> : <Tag color="red">NO</Tag>

	const activeColor = "var(--debug-active)"
	const inactiveColor = "var(--debug-inactive)"

	if (!audioInfo) {
		return <Empty description="No audio data available" />
	}

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title="Audio Input Pipeline"
				style={{ marginBottom: 12 }}
			>
				<Row
					gutter={[8, 8]}
					style={{ marginBottom: 12 }}
				>
					<Col span={6}>
						<Statistic
							title="Mic Stream"
							value={audioInfo.hasMicStream ? "Active" : "None"}
							valueStyle={{
								color: audioInfo.hasMicStream
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
					<Col span={6}>
						<Statistic
							title="Mic Producer"
							value={
								audioInfo.hasMicProducer ? "Producing" : "Idle"
							}
							valueStyle={{
								color: audioInfo.hasMicProducer
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
					<Col span={6}>
						<Statistic
							title="AudioInput Ready"
							value={audioInfo.hasAudioInput ? "Ready" : "None"}
							valueStyle={{
								color: audioInfo.hasAudioInput
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
					<Col span={6}>
						<Statistic
							title="RTP Worker"
							value={
								audioInfo.micWorkerExists
									? "Running"
									: "Stopped"
							}
							valueStyle={{
								color: audioInfo.micWorkerExists
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
				</Row>

				{audioInfo.hasAudioInput && (
					<Descriptions
						size="small"
						column={2}
						bordered
						style={{ marginBottom: 12 }}
					>
						<Descriptions.Item label="Context State">
							<Tag
								color={
									audioInfo.audioInputContext?.state ===
									"running"
										? "green"
										: "orange"
								}
							>
								{audioInfo.audioInputContext?.state}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Sample Rate">
							{audioInfo.audioInputContext?.sampleRate} Hz
						</Descriptions.Item>
						<Descriptions.Item label="Base Latency">
							{(
								audioInfo.audioInputContext?.baseLatency * 1000
							)?.toFixed(2)}{" "}
							ms
						</Descriptions.Item>
						<Descriptions.Item label="Main Gain">
							{audioInfo.audioInputMainGain?.toFixed(2)}
						</Descriptions.Item>
						<Descriptions.Item label="Volume Gate">
							{boolTag(audioInfo.hasVolumeGate)}
						</Descriptions.Item>
						<Descriptions.Item label="Noise Suppression">
							{boolTag(audioInfo.hasNoiseSuppression)}
						</Descriptions.Item>
					</Descriptions>
				)}

				{audioInfo.micStreamTracks.length > 0 && (
					<Descriptions
						size="small"
						column={2}
						bordered
						title="Mic Tracks"
					>
						{audioInfo.micStreamTracks.map((track, i) => (
							<React.Fragment key={i}>
								<Descriptions.Item label={`Track ${i} Kind`}>
									<Tag>{track.kind}</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="State">
									<Tag
										color={
											track.readyState === "live"
												? "green"
												: "red"
										}
									>
										{track.readyState}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Enabled">
									<Tag
										color={track.enabled ? "green" : "red"}
									>
										{String(track.enabled)}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Label">
									{track.label}
								</Descriptions.Item>
							</React.Fragment>
						))}
					</Descriptions>
				)}
			</Card>

			<Card
				size="small"
				title="Audio Output Pipeline"
				style={{ marginBottom: 12 }}
			>
				<Row
					gutter={[8, 8]}
					style={{ marginBottom: 12 }}
				>
					<Col span={8}>
						<Statistic
							title="AudioOutput"
							value={audioInfo.hasAudioOutput ? "Active" : "None"}
							valueStyle={{
								color: audioInfo.hasAudioOutput
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
					<Col span={8}>
						<Statistic
							title="SysAudio"
							value={audioInfo.hasSysAudio ? "Active" : "None"}
							valueStyle={{
								color: audioInfo.hasSysAudio
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
					<Col span={8}>
						<Statistic
							title="SysAudio Output"
							value={
								audioInfo.sysAudioHasOutput
									? "Supported"
									: "N/A"
							}
							valueStyle={{
								color: audioInfo.sysAudioHasOutput
									? activeColor
									: inactiveColor,
								fontSize: 14,
							}}
						/>
					</Col>
				</Row>

				{audioInfo.hasAudioOutput && (
					<Descriptions
						size="small"
						column={2}
						bordered
						style={{ marginBottom: 12 }}
					>
						<Descriptions.Item label="Context State">
							<Tag
								color={
									audioInfo.audioOutputContext?.state ===
									"running"
										? "green"
										: "orange"
								}
							>
								{audioInfo.audioOutputContext?.state}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Sample Rate">
							{audioInfo.audioOutputContext?.sampleRate} Hz
						</Descriptions.Item>
						<Descriptions.Item label="Main Gain">
							{audioInfo.audioOutputMainGain?.toFixed(2)}
						</Descriptions.Item>
					</Descriptions>
				)}

				{audioInfo.hasSysAudio && (
					<Descriptions
						size="small"
						column={2}
						bordered
						title="SysAudio Details"
					>
						<Descriptions.Item label="Ready for Frames">
							{boolTag(audioInfo.sysAudioReady)}
						</Descriptions.Item>
						<Descriptions.Item label="Output Bus Gain">
							{audioInfo.sysAudioOutputBusGain?.toFixed(2) ??
								"N/A"}
						</Descriptions.Item>
						{audioInfo.sysAudioInputCtx && (
							<>
								<Descriptions.Item label="Input Ctx State">
									<Tag
										color={
											audioInfo.sysAudioInputCtx.state ===
											"running"
												? "green"
												: "orange"
										}
									>
										{audioInfo.sysAudioInputCtx.state}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Input Ctx Rate">
									{audioInfo.sysAudioInputCtx.sampleRate} Hz
								</Descriptions.Item>
							</>
						)}
						{audioInfo.sysAudioOutputCtx && (
							<>
								<Descriptions.Item label="Output Ctx State">
									<Tag
										color={
											audioInfo.sysAudioOutputCtx
												.state === "running"
												? "green"
												: "orange"
										}
									>
										{audioInfo.sysAudioOutputCtx.state}
									</Tag>
								</Descriptions.Item>
								<Descriptions.Item label="Output Ctx Rate">
									{audioInfo.sysAudioOutputCtx.sampleRate} Hz
								</Descriptions.Item>
							</>
						)}
					</Descriptions>
				)}
			</Card>

			<Card
				size="small"
				title="Other Producers"
			>
				<Descriptions
					size="small"
					column={3}
					bordered
				>
					<Descriptions.Item label="Camera Stream">
						{boolTag(audioInfo.hasCamStream)}
					</Descriptions.Item>
					<Descriptions.Item label="Camera Producer">
						{boolTag(audioInfo.hasCamProducer)}
					</Descriptions.Item>
					<Descriptions.Item label="Screen Stream">
						{boolTag(audioInfo.hasScreenStream)}
					</Descriptions.Item>
					<Descriptions.Item label="Screen Producer">
						{boolTag(audioInfo.hasScreenProducer)}
					</Descriptions.Item>
					<Descriptions.Item label="Screen Audio Producer">
						{boolTag(audioInfo.hasScreenAudioProducer)}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			<Card
				size="small"
				title="Audio Settings"
				style={{ marginTop: 12 }}
			>
				<Descriptions
					size="small"
					column={2}
					bordered
				>
					<Descriptions.Item label="Input Device">
						<code style={{ fontSize: 11 }}>
							{audioInfo.inputDeviceId}
						</code>
					</Descriptions.Item>
					<Descriptions.Item label="Output Device">
						<code style={{ fontSize: 11 }}>
							{audioInfo.outputDeviceId}
						</code>
					</Descriptions.Item>
					{audioInfo.audioSettings && (
						<>
							<Descriptions.Item label="Noise Suppression">
								<Tag>
									{audioInfo.audioSettings.noiseSuppression}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="Echo Cancellation">
								<Tag>
									{String(
										audioInfo.audioSettings
											.echoCancellation,
									)}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="Auto Gain">
								<Tag>
									{String(audioInfo.audioSettings.autoGain)}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="Volume Gate Threshold">
								<Tag>
									{
										audioInfo.audioSettings
											.volumeGateThreshold
									}{" "}
									dB
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="Input Gain">
								<Tag>{audioInfo.audioSettings.inputGain}</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="Output Gain">
								<Tag>{audioInfo.audioSettings.outputGain}</Tag>
							</Descriptions.Item>
						</>
					)}
				</Descriptions>
			</Card>
		</div>
	)
}
