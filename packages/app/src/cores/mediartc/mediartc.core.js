import Core from "vessel/core"
import { RTEngineClient } from "linebridge-client"
import SessionModel from "@models/session"

import MediaRTCState from "./classes/State"
import MediaRTCUI from "./classes/UI"
import Self from "./classes/Self"
import Consumers from "./classes/Consumers"
import Producers from "./classes/Producers"
import Clients from "./classes/Clients"
import Screens from "./classes/Screens"

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

const WebsocketEvents = {
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

	static defaultAudioEncodingParams = {
		maxBitrate: 98000,
		priority: "high",
		networkPriority: "high",
		dtx: true,
	}

	static defaultVideoEncodingParams = {
		maxBitrate: 5000000,
		maxFramerate: 60,
		priority: "high",
		networkPriority: "high",
	}

	static defaultScreenAudioEncodingParams = {
		maxBitrate: 320000,
		priority: "high",
		networkPriority: "high",
	}

	socket = null
	device = null
	sendTransport = null
	recvTransport = null

	ui = new MediaRTCUI(this)
	state = new MediaRTCState(this)

	self = new Self(this)
	clients = new Clients(this)
	screens = new Screens(this)

	producers = new Producers(this)
	consumers = new Consumers(this)

	public = {
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

	handlers = {
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
			this.console.debug("auth manager started, connecting to rtc")

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
		"authmanager:logout": async () => {
			this.console.debug(
				"auth manager logged out, disconnecting from rtc",
			)

			//await this.disconnectSocket()
		},
	}

	async afterInitialize() {
		this.self.audioOutput.initialize()
	}

	async connectSocket({ registerEvents }) {
		try {
			this.state.status = "connecting"

			this.console.debug(
				"connecting to rtc websocket",
				this.constructor.wsUrl,
			)

			this.socket = new RTEngineClient({
				refName: "rtc",
				url: this.constructor.wsUrl,
				token: SessionModel.token,
				maxConnectRetries: 0,
			})

			await this.socket.connect()

			// register events
			for (const event of Object.keys(registerEvents)) {
				this.socket.on(
					event,
					buildWebsocketHandler(this, registerEvents[event]),
				)
			}

			this.state.status = "connected"
		} catch (error) {
			this.console.error("Error connecting ws:", error)
			this.state.status = "failed"
		}
	}

	async disconnectSocket() {
		try {
			this.state.status = "disconnecting"

			this.console.debug("disconnecting rtc websocket")

			// destroy socket
			await this.socket.destroy()

			this.state.status = "disconnected"
		} catch (error) {
			this.console.error("Error disconnecting ws:", error)

			this.state.status = "failed"
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
