import { Core } from "@ragestudio/vessel"

import AudioProcessor from "./classes/AudioProcessor"
import MediaRTCState from "./classes/State"
import MediaRTCUI from "./classes/UI"

import * as Vars from "./vars"

// handlers
import connectSocket from "./handlers/connectSocket"
import disconnectSocket from "./handlers/disconnectSocket"
import createProducer from "./handlers/createProducer"
import createTransports from "./handlers/createTransports"
import changeInputParams from "./handlers/changeInputParams"
import changeOutputParams from "./handlers/changeOutputParams"
import changeScreenParams from "./handlers/changeScreenParams"
import updateClientVoiceState from "./handlers/updateClientVoiceState"
import soundpadDispatch from "./handlers/soundpadDispatch"

import muteMicrophone from "./handlers/muteMicrophone"
import unmuteMicrophone from "./handlers/unmuteMicrophone"
import deafenAudio from "./handlers/deafenAudio"
import undeafenAudio from "./handlers/undeafenAudio"

import joinChannel from "./handlers/joinChannel"
import leaveChannel from "./handlers/leaveChannel"
import startScreenShare from "./handlers/startScreenShare"
import stopScreenShare from "./handlers/stopScreenShare"
import initializeUserAudio from "./handlers/initializeUserAudio"
import initializeUserScreen from "./handlers/initializeUserScreen"
import attachAudioMedia from "./handlers/attachAudioMedia"
import dettachAudioMedia from "./handlers/dettachAudioMedia"
import startClientMic from "./handlers/startClientMic"
import stopClientMic from "./handlers/stopClientMic"

import startConsumer from "./handlers/startConsumer"
import startAudioProducer from "./handlers/startAudioProducer"
import startScreenProducer from "./handlers/startScreenProducer"
import startVoiceDetector from "./handlers/startVoiceDetector"

import stopConsumer from "./handlers/stopConsumer"
import stopAudioProducer from "./handlers/stopAudioProducer"
import stopScreenProducer from "./handlers/stopScreenProducer"
import stopVoiceDetector from "./handlers/stopVoiceDetector"

// ws events
import clientJoinedEvent from "./events/clientJoined"
import clientLeftEvent from "./events/clientLeft"
import clientEventEvent from "./events/clientEvent"
import producerJoinedEvent from "./events/producerJoined"
import producerLeftEvent from "./events/producerLeft"
import soundpadDispatchEvent from "./events/soundpadDispatch"

const WebsocketEvents = {
	"media:channel:client:joined": clientJoinedEvent,
	"media:channel:client:left": clientLeftEvent,
	"media:channel:client_event": clientEventEvent,
	"media:channel:producer:joined": producerJoinedEvent,
	"media:channel:producer:left": producerLeftEvent,
	"media:channel:soundpad:dispatch": soundpadDispatchEvent,
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

	static get inputDeviceId() {
		return app.cores.settings.get("mediartc:input_device")
	}

	static get outputDeviceId() {
		return app.cores.settings.get("mediartc:output_device")
	}

	get isMuted() {
		return this.audioProducer ? this.audioProducer.paused : false
	}

	get isDeafened() {
		return this.audioOutput.context.state === "suspended"
	}

	static defaultAudioEncodingParams = {
		maxBitrate: 98000,
		priority: "high",
		networkPriority: "high",
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

	get audioParams() {
		return {
			echoCancellation:
				app.cores.settings.get("mediartc:echoCancellation") ?? true,
			noiseSuppression:
				app.cores.settings.get("mediartc:noiseSuppression") ?? true,
			autoGainControl:
				app.cores.settings.get("mediartc:audioGainControl") ?? true,
			sampleRate: 44100,
			channelCount: 1,
			volume: app.cores.settings.get("mediartc:audioVolume") ?? 1.0,
		}
	}

	ui = new MediaRTCUI(this)
	state = new MediaRTCState(this)

	socket = null
	device = null
	sendTransport = null
	recvTransport = null

	audioProducer = null
	screenShareProducer = null

	audioStream = null
	screenStream = null

	producers = new Map()
	consumers = new Map()
	voiceDetectors = new Set()
	audioElements = new Map()

	audioOutput = null
	audioInput = null

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
		connectSocket: connectSocket.bind(this),
		disconnectSocket: disconnectSocket.bind(this),
		joinChannel: joinChannel.bind(this),
		leaveChannel: leaveChannel.bind(this),
		initializeUserAudio: initializeUserAudio.bind(this),
		initializeUserScreen: initializeUserScreen.bind(this),
		attachAudioMedia: attachAudioMedia.bind(this),
		dettachAudioMedia: dettachAudioMedia.bind(this),
		startConsumer: startConsumer.bind(this),
		startScreenShare: startScreenShare.bind(this),
		stopScreenShare: stopScreenShare.bind(this),
		startAudioProducer: startAudioProducer.bind(this),
		startScreenProducer: startScreenProducer.bind(this),
		startVoiceDetector: startVoiceDetector.bind(this),
		startClientMic: startClientMic.bind(this),
		stopClientMic: stopClientMic.bind(this),
		stopConsumer: stopConsumer.bind(this),
		stopAudioProducer: stopAudioProducer.bind(this),
		stopScreenProducer: stopScreenProducer.bind(this),
		stopVoiceDetector: stopVoiceDetector.bind(this),
		createTransports: createTransports.bind(this),
		createProducer: createProducer.bind(this),
		muteMicrophone: muteMicrophone.bind(this),
		unmuteMicrophone: unmuteMicrophone.bind(this),
		deafenAudio: deafenAudio.bind(this),
		undeafenAudio: undeafenAudio.bind(this),
		changeInputParams: changeInputParams.bind(this),
		changeOutputParams: changeOutputParams.bind(this),
		changeScreenParams: changeScreenParams.bind(this),
		updateClientVoiceState: updateClientVoiceState.bind(this),
		soundpadDispatch: soundpadDispatch.bind(this),
	}

	onRuntimeEvents = {
		"authmanager:authed": async () => {
			this.console.debug("auth manager started, connecting to rtc")

			await this.handlers.connectSocket({
				registerEvents: WebsocketEvents,
			})
		},
		"authmanager:logout": async () => {
			this.console.debug(
				"auth manager logged out, disconnecting from rtc",
			)

			await this.handlers.disconnectSocket()
		},
	}

	async afterInitialize() {
		this.audioOutput = new AudioProcessor(this, {
			sinkId: MediaRTC.outputDeviceId,
		})
	}

	async sendVoiceStateUpdate() {
		await this.socket.emit("channel:client_event", {
			event: "updateVoiceState",
			data: {
				muted: this.isMuted,
				deafened: this.isDeafened,
			},
		})
	}
}
