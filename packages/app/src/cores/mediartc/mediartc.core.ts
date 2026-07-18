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
import AutoRecovery from "./classes/AutoRecovery"

import buildWebsocketHandler from "./utils/buildWebsocketHandler"
import * as Vars from "./vars"

// handlers
import attachChannel from "./handlers/attachChannel"
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
import DebugWindow from "./debug/DebugWindow"
import React from "react"

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
	static dependencies = ["settings", "api", "sfx", "window_mng"]

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
	static defaultCameraVideoEncodingParams = defaults.cameraVideoEncodingParams
	static defaultScreenVideoEncodingParams = defaults.screenVideoEncodingParams
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
	autoRecovery = new AutoRecovery(this)

	// the groupId used to join the current channel (for recovery)
	_joinedGroupId: string | null = null

	// set while intentionally switching channels to prevent auto-recovery
	_switchingToChannelId: string | null = null

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
		openDebugWindow: this.openDebugWindow.bind(this),
		closeDebugWindow: this.closeDebugWindow.bind(this),
	}

	handlers: MediaRTCHandlers = {
		attachChannel: attachChannel.bind(this),
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
		},
		"api:reinitialized": async () => {
			this.socket = app.cores.api.client().ws.sockets.get("main")

			for (const event of Object.keys(WebsocketEvents)) {
				this.socket.on(
					event,
					buildWebsocketHandler(this, WebsocketEvents[event]),
				)
			}

			if (this.autoRecovery.snapshot) {
				this.console.log(
					"[auto-recovery] WS reinitialized, attempting recovery",
				)
				this.autoRecovery.start()
			}
		},
		"wsmanager:main:reconnected": () => {
			if (this.autoRecovery.snapshot) {
				this.console.log(
					"[auto-recovery] WS reconnected, attempting recovery",
				)
				this.autoRecovery.start()
			}
		},
		"authmanager:logout": async () => {
			this.console.debug(
				"auth manager logged out, disconnecting from rtc",
			)

			this.autoRecovery.cancel()
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

			if (!this.self.sysAudio?.outputBus) {
				// sysaudio output not available, fallback to AudioProcessor
				this.self.audioOutput = new AudioProcessor(this, {
					sinkId: Self.outputDeviceId,
				})
			}
		}

		if (this.self.audioOutput) {
			this.self.audioOutput.initialize()
		}
	}

	debugWindowId = "mediartc-debug"

	async openDebugWindow() {
		if (app.cores.window_mng.has(this.debugWindowId)) {
			this.console.log("Debug window already open")
			return
		}

		const component = React.createElement(DebugWindow)

		await app.cores.window_mng.open(this.debugWindowId, component)

		this.console.log("Debug window opened")
	}

	async closeDebugWindow() {
		if (!app.cores.window_mng.has(this.debugWindowId)) {
			return
		}

		await app.cores.window_mng.closeById(this.debugWindowId)
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

	async _handleTransportFailure() {
		if (this.autoRecovery.isRecovering) {
			this.console.debug(
				"[auto-recovery] Transport failure during recovery, skipping",
			)
			return
		}

		if (!this.state.isJoined) {
			this.console.debug(
				"[auto-recovery] Not joined, skipping transport failure handler",
			)
			return
		}

		this.console.warn(
			"[auto-recovery] Transport failure detected, starting recovery",
		)

		const snapshot = this.autoRecovery.takeSnapshot()

		if (!snapshot) {
			return
		}

		await this.consumers.stopAll()
		await this.clients.destroyAll()

		// stop self producers but keep media streams alive
		if (this.self.micProducer && !this.self.micProducer.closed) {
			this.self.micProducer.close()
		}
		if (this.self.screenProducer && !this.self.screenProducer.closed) {
			this.self.screenProducer.close()
		}
		if (
			this.self.screenAudioProducer &&
			!this.self.screenAudioProducer.closed
		) {
			this.self.screenAudioProducer.close()
		}
		if (this.self.camProducer && !this.self.camProducer.closed) {
			this.self.camProducer.close()
		}

		if (this.sendTransport && !this.sendTransport.closed) {
			this.sendTransport.close()
		}
		if (this.recvTransport && !this.recvTransport.closed) {
			this.recvTransport.close()
		}

		this.producers.clear()
		this.device = null

		this.state.isJoined = false
		this.state.isLoading = false
		this.state.recvTransportState = "closed"
		this.state.sendTransportState = "closed"

		this.autoRecovery.start()
	}
}
