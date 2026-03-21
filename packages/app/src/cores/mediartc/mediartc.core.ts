import Core from "vessel/core"
import { RTEngineClient } from "linebridge-client"
import AudioProcessor from "./classes/AudioProcessor"

import MediaRTCState, { MediaRTCStateType } from "./classes/State"
import MediaRTCUI from "./classes/UI"
import Self from "./classes/Self"
import Consumers from "./classes/Consumers"
import Producers from "./classes/Producers"
import Clients from "./classes/Clients"
import Screens from "./classes/Screens"
import SysAudio from "./classes/SysAudio"

import buildWebsocketHandler from "./utils/buildWebsocketHandler"
import * as Vars from "./vars"

// handlers
import createTransports from "./handlers/createTransports"
import changeInputParams from "./handlers/changeInputParams"
import changeOutputParams from "./handlers/changeOutputParams"
import changeScreenParams from "./handlers/changeScreenParams"

import joinChannel from "./handlers/joinChannel"
import leaveChannel from "./handlers/leaveChannel"

import startScreenShare from "./handlers/startScreenShare"
import stopScreenShare from "./handlers/stopScreenShare"

import toggleMute from "./handlers/toggleMute"
import toggleDeafen from "./handlers/toggleDeafen"

import startCameraShare from "./handlers/startCameraShare"
import stopCameraShare from "./handlers/stopCameraShare"

import soundpadDispatch from "./handlers/soundpadDispatch"
import callUser from "./handlers/callUser"

// ws events
import channelDisconnectedEvent from "./events/channelDisconnected"
import clientJoinedEvent from "./events/clientJoined"
import clientLeftEvent from "./events/clientLeft"
import clientEventEvent from "./events/clientEvent"
import producerJoinedEvent from "./events/producerJoined"
import producerLeftEvent from "./events/producerLeft"
import soundpadDispatchEvent from "./events/soundpadDispatch"
import callIncomingEvent from "./events/callIncoming"

import defaults from "./defaults"

import type { MediaRTCHandlers, MediaRTCPublic, WebsocketEvent } from "./types"

const WebsocketEvents: WebsocketEvent = {
	"media:channel:client:joined": clientJoinedEvent,
	"media:channel:client:left": clientLeftEvent,
	"media:channel:client_event": clientEventEvent,
	"media:channel:producer:joined": producerJoinedEvent,
	"media:channel:producer:left": producerLeftEvent,
	"media:channel:soundpad:dispatch": soundpadDispatchEvent,
	"call:incoming": callIncomingEvent,
	"media:channel:disconnected": channelDisconnectedEvent,
}

export default class MediaRTC extends Core {
	static namespace = "mediartc"
	static dependencies = ["settings", "api", "sfx"]

	static bgColor = "hotPink"
	static textColor = "black"

	static get wsUrl() {
		return (
			(window.location.protocol === "https:" ? "wss://" : "ws://") +
			window.location.host +
			"/api" +
			"/rtc"
		)
	}

	static defaultAudioEncodingParams = defaults.audioEncodingParams
	static defaultVideoEncodingParams = defaults.videoEncodingParams
	static defaultScreenAudioEncodingParams = defaults.screenAudioEncodingParams

	socket: RTEngineClient | null = null
	device: any = null
	sendTransport: any = null
	recvTransport: any = null

	ui = new MediaRTCUI(this)
	state = new MediaRTCState(this) as unknown as MediaRTCStateType

	self = new Self(this)
	clients = new Clients(this)
	screens = new Screens(this)

	producers = new Producers(this)
	consumers = new Consumers(this)

	rtpMicWorker: Worker | null = null

	public: MediaRTCPublic = {
		instance: () => this,
		handlers: () => this.handlers,
		state: () => {
			return {
				...this.state,
			}
		},
		vars: () => Vars,
		socket: () => this.socket,
	}

	handlers: MediaRTCHandlers = {
		joinChannel: joinChannel.bind(this),
		leaveChannel: leaveChannel.bind(this),
		startCameraShare: startCameraShare.bind(this),
		stopCameraShare: stopCameraShare.bind(this),
		startScreenShare: startScreenShare.bind(this),
		stopScreenShare: stopScreenShare.bind(this),
		createTransports: createTransports.bind(this),
		changeInputParams: changeInputParams.bind(this),
		changeOutputParams: changeOutputParams.bind(this),
		changeScreenParams: changeScreenParams.bind(this),
		soundpadDispatch: soundpadDispatch.bind(this),
		toggleMute: toggleMute.bind(this),
		toggleDeafen: toggleDeafen.bind(this),
		callUser: callUser.bind(this),
	}

	onRuntimeEvents = {
		"authmanager:authed": async () => {
			this.socket = app.cores.api.client().ws.sockets.get("main")

			for (const event of Object.keys(WebsocketEvents)) {
				this.socket.on(
					event,
					buildWebsocketHandler(this, WebsocketEvents[event]),
				)
			}

			// await this.connectSocket({
			// 	registerEvents: WebsocketEvents,
			// })
		},
		"api:reinitialized": async () => {
			this.socket = app.cores.api.client().ws.sockets.get("main")

			for (const event of Object.keys(WebsocketEvents)) {
				this.socket.on(
					event,
					buildWebsocketHandler(this, WebsocketEvents[event]),
				)
			}
		},
		"authmanager:logout": async () => {
			this.console.debug(
				"auth manager logged out, disconnecting from rtc",
			)

			//await this.disconnectSocket()
		},
	}

	async afterInitialize() {
		this.rtpMicWorker = new Worker(
			new URL("./workers/rtp-stream.js", import.meta.url),
		)

		this.rtpMicWorker.onmessage = (event) => {
			const { id, type, isSpeaking } = event.data

			if (type === "consumer" && this.consumers.has(id)) {
				// set consumer speaking state
				this.consumers.get(id).isSpeaking = isSpeaking

				if (isSpeaking) {
					this.state.speakingConsumers.push(id)
				} else {
					const index = this.state.speakingConsumers.findIndex(
						(_id) => _id === id,
					)

					if (index !== -1) {
						this.state.speakingConsumers.splice(index, 1)
					}
				}
			}

			if (type === "producer" && this.producers.has(id)) {
				const producer = this.producers.get(id)

				if (
					producer.self === true &&
					producer.appData?.mediaTag === "user-mic"
				) {
					this.state.isSpeaking = isSpeaking
				}
			}
		}

		if (app.isDesktop) {
			if (!this.self.sysAudio) {
				this.self.sysAudio = new SysAudio()
			}

			try {
				await this.self.sysAudio.initialize()
			} catch (error) {
				this.console.error("Error initializing sysAudio:", error)
			}

			if (this.self.sysAudio || !this.self.sysAudio?.outputBus) {
				// if sysAudio is initialized or does not support sysAudio-Output,
				// fallback to AudioProcessor
				this.self.audioOutput = new AudioProcessor(this, {
					sinkId: Self.outputDeviceId,
				})
			}
		}

		if (this.self.audioOutput) {
			this.self.audioOutput.initialize()
		}
	}

	async sendVoiceStateUpdate() {
		await this.socket.emit("channel:client_event", {
			event: "updateVoiceState",
			data: {
				muted: this.self.isMuted,
				deafened: this.self.isDeafened,
			},
		})
	}
}
