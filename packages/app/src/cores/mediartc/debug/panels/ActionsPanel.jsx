import React, { useState } from "react"
import {
	Card,
	Button,
	Space,
	Divider,
	Input,
	message,
	Popconfirm,
	Tag,
} from "antd"

export default function ActionsPanel({ core, state, addLogEvent }) {
	const [joinGroupId, setJoinGroupId] = useState("")
	const [joinChannelId, setJoinChannelId] = useState("")
	const [callUserId, setCallUserId] = useState("")

	const exec = async (label, fn) => {
		try {
			addLogEvent("action", { action: label })
			await fn()
			message.success(`${label} executed`)
		} catch (err) {
			addLogEvent("action:error", { action: label, error: err.message })
			message.error(`${label} failed: ${err.message}`)
		}
	}

	const handlers = core?.handlers

	return (
		<div className="debug-panel">
			<Card
				size="small"
				title="Channel Actions"
				style={{ marginBottom: 12 }}
			>
				<Space
					direction="vertical"
					style={{ width: "100%" }}
				>
					<div>
						<Input
							placeholder="Group ID"
							value={joinGroupId}
							onChange={(e) => setJoinGroupId(e.target.value)}
							style={{ width: 200, marginRight: 8 }}
						/>
						<Input
							placeholder="Channel ID"
							value={joinChannelId}
							onChange={(e) => setJoinChannelId(e.target.value)}
							style={{ width: 200, marginRight: 8 }}
						/>
						<Button
							type="primary"
							onClick={() =>
								exec("joinChannel", () =>
									handlers.joinChannel(
										joinGroupId,
										joinChannelId,
									),
								)
							}
							disabled={
								!joinGroupId || !joinChannelId || state.isJoined
							}
						>
							Join Channel
						</Button>
					</div>

					<Space>
						<Button
							type="primary"
							danger
							onClick={() =>
								exec("leaveChannel", () =>
									handlers.leaveChannel(),
								)
							}
							disabled={!state.isJoined}
						>
							Leave Channel
						</Button>
						<Button
							onClick={() =>
								exec("createTransports", () =>
									handlers.createTransports(),
								)
							}
						>
							Recreate Transports
						</Button>
						<Button
							onClick={() =>
								exec("attachChannel", () =>
									handlers.attachChannel({}),
								)
							}
						>
							Attach Channel
						</Button>
					</Space>
				</Space>
			</Card>

			<Card
				size="small"
				title="Voice Actions"
				style={{ marginBottom: 12 }}
			>
				<Space wrap>
					<Button
						onClick={() =>
							exec("toggleMute", () => handlers.toggleMute())
						}
					>
						{state.isMuted ? "Unmute" : "Mute"}
					</Button>
					<Button
						onClick={() =>
							exec("toggleDeafen", () => handlers.toggleDeafen())
						}
					>
						{state.isDeafened ? "Undeafen" : "Deafen"}
					</Button>
					<Divider type="vertical" />
					<Popconfirm
						title="Force mute?"
						onConfirm={() =>
							exec("toggleMute(true)", () =>
								handlers.toggleMute(true),
							)
						}
					>
						<Button size="small">Force Mute</Button>
					</Popconfirm>
					<Popconfirm
						title="Force unmute?"
						onConfirm={() =>
							exec("toggleMute(false)", () =>
								handlers.toggleMute(false),
							)
						}
					>
						<Button size="small">Force Unmute</Button>
					</Popconfirm>
					<Popconfirm
						title="Force deafen?"
						onConfirm={() =>
							exec("toggleDeafen(true)", () =>
								handlers.toggleDeafen(true),
							)
						}
					>
						<Button size="small">Force Deafen</Button>
					</Popconfirm>
					<Popconfirm
						title="Force undeafen?"
						onConfirm={() =>
							exec("toggleDeafen(false)", () =>
								handlers.toggleDeafen(false),
							)
						}
					>
						<Button size="small">Force Undeafen</Button>
					</Popconfirm>
				</Space>
			</Card>

			<Card
				size="small"
				title="Screen & Camera"
				style={{ marginBottom: 12 }}
			>
				<Space wrap>
					<Button
						onClick={() =>
							exec("startScreenShare", () =>
								handlers.startScreenShare(),
							)
						}
						disabled={state.isProducingScreen}
					>
						Start Screen Share
					</Button>
					<Button
						danger
						onClick={() =>
							exec("stopScreenShare", () =>
								handlers.stopScreenShare(),
							)
						}
						disabled={!state.isProducingScreen}
					>
						Stop Screen Share
					</Button>
					<Divider type="vertical" />
					<Button
						onClick={() =>
							exec("startCameraShare", () =>
								handlers.startCameraShare(),
							)
						}
						disabled={state.isProducingCamera}
					>
						Start Camera
					</Button>
					<Button
						danger
						onClick={() =>
							exec("stopCameraShare", () =>
								handlers.stopCameraShare(),
							)
						}
						disabled={!state.isProducingCamera}
					>
						Stop Camera
					</Button>
				</Space>
			</Card>

			<Card
				size="small"
				title="Call"
				style={{ marginBottom: 12 }}
			>
				<Space>
					<Input
						placeholder="User ID to call"
						value={callUserId}
						onChange={(e) => setCallUserId(e.target.value)}
						style={{ width: 250 }}
					/>
					<Button
						onClick={() =>
							exec("callUser", () =>
								handlers.callUser(callUserId),
							)
						}
						disabled={!callUserId}
					>
						Call
					</Button>
				</Space>
			</Card>

			<Card
				size="small"
				title="Audio Params Quick Change"
				style={{ marginBottom: 12 }}
			>
				<Space wrap>
					<Button
						size="small"
						onClick={() =>
							exec("changeInputParams", () =>
								handlers.changeInputParams({
									maxBitrate: 16000,
								}),
							)
						}
					>
						Input 16kbps
					</Button>
					<Button
						size="small"
						onClick={() =>
							exec("changeInputParams", () =>
								handlers.changeInputParams({
									maxBitrate: 32000,
								}),
							)
						}
					>
						Input 32kbps
					</Button>
					<Button
						size="small"
						onClick={() =>
							exec("changeInputParams", () =>
								handlers.changeInputParams({
									maxBitrate: 64000,
								}),
							)
						}
					>
						Input 64kbps
					</Button>
					<Button
						size="small"
						onClick={() =>
							exec("changeInputParams", () =>
								handlers.changeInputParams({
									maxBitrate: 128000,
								}),
							)
						}
					>
						Input 128kbps
					</Button>
				</Space>
			</Card>

			<Card
				size="small"
				title="Soundpad"
				style={{ marginBottom: 12 }}
			>
				<Space>
					<Input
						placeholder="Sound ID"
						id="soundpad-input"
						style={{ width: 200 }}
					/>
					<Button
						onClick={() => {
							const input =
								document.getElementById("soundpad-input")
							const soundId = input?.value
							if (soundId) {
								exec("soundpadDispatch", () =>
									handlers.soundpadDispatch(soundId),
								)
							}
						}}
					>
						Dispatch Soundpad
					</Button>
				</Space>
			</Card>

			<Card
				size="small"
				title="Danger Zone"
			>
				<Popconfirm
					title="This will stop all producers and consumers. Continue?"
					onConfirm={async () => {
						try {
							if (core?.self) {
								await core.self.stopAll()
							}
							message.success("All stopped")
							addLogEvent("action", { action: "stopAll" })
						} catch (err) {
							message.error(err.message)
						}
					}}
				>
					<Button danger>Stop All (Self Producers & Streams)</Button>
				</Popconfirm>
			</Card>
		</div>
	)
}
