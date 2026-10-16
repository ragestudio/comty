import "@comty/shared/utils/index"

import type { Channel } from "@comty/shared/types/spaces/channel"
import type { Client } from "./clients/client"
import type { SerializedRemoteMedia } from "./remote/media"
import type { ConnectionState, RtpCapabilities } from "mediasoup-client/types"

import * as mediasoupClient from "mediasoup-client"
import { EventEmitter } from "tseep"
import BaseStore from "@/classes/BaseStore"
import client from "comty.js/core/client"
import session from "comty.js/core/session"
import logger from "@/utils/logger"

import Self from "./self"
import Producers from "./producers"
import Consumers from "./consumers"
import Clients from "./clients"
import Transports from "./transports"
import Screens from "./screens"
import Cameras from "./cameras"
import Events from "./events"

import type Producer from "./producers/producer"

import joinChannel from "./handlers/joinChannel"
import leaveChannel from "./handlers/leaveChannel"
import attachChannel from "./handlers/attachChannel"
import syncVoiceState from "./handlers/syncVoiceState"
import emitClientEvent from "./handlers/emitClientEvent"
import reset from "./handlers/reset"

export type { SerializedRemoteMedia } from "./remote/media"

type ConnState =
	| "disconnected"
	| "loading"
	| "connecting"
	| "connected"
	| "failed"

type TransportConnState = ConnectionState & {}

export interface RTCReactiveState {
	initialized: boolean
	state: ConnState
	connectedAt: Date | null
	channel: Channel | null
	voiceState: {
		muted: boolean
		deafened: boolean
	}
	isSpeaking: boolean

	statedClients: Partial<ReturnType<Client["serialize"]>>[]
	remoteProducersIds: string[]
	speakingClients: string[]
	statedScreens: SerializedRemoteMedia[]
	statedCameras: SerializedRemoteMedia[]

	localScreenStreamURL: string | null
	localCameraStreamURL: string | null

	micProducerId: string | null
	cameraProducerId: string | null
	screenVideoProducerId: string | null
	screenAudioProducerId: string | null

	sendTransportState: TransportConnState
	recvTransportState: TransportConnState
}

// payload of a soundpad dispatch
export interface RTCDispatchPayload {
	userId: string
	src: string
	icon?: string
}

// events emitted on the rtc event bus, consumers can subscribe to react to
// any relevant session change (sounds, notifications, analytics, ...)
export type RTCEventMap = {
	// session lifecycle
	"rtc:channel:joined": (channel: Channel | null) => void
	"rtc:channel:join_failed": (payload: { error: unknown }) => void
	"rtc:channel:left": () => void
	"rtc:channel:leave_failed": (payload: { error: unknown }) => void
	"rtc:channel:disconnected": (payload: any) => void
	"channel:attached": (channel: Channel) => void

	// local voice state
	"rtc:mute": () => void
	"rtc:unmute": () => void
	"rtc:deafen": () => void
	"rtc:undeafen": () => void

	// remote clients
	"rtc:client:joined": (client: Client) => void
	"rtc:client:left": (client: Client) => void

	// producers, local and remote
	"rtc:producer:joined": (producer: Producer) => void
	"rtc:producer:left": (producer: Producer) => void
	"rtc:producer:error": (payload: { error: unknown }) => void

	// soundpad
	"rtc:vc:soundpad": (payload: RTCDispatchPayload) => void
	"rtc:vc:soundpad:ended": (payload: RTCDispatchPayload) => void

	// any other dynamic event
	[key: string]: (...args: any[]) => void
}

export class RTC extends BaseStore<RTCReactiveState> {
	device: mediasoupClient.Device | null = null

	self = new Self(this)
	transports = new Transports(this)
	producers = new Producers(this)
	consumers = new Consumers(this)
	clients = new Clients(this)
	screens = new Screens(this)
	cameras = new Cameras(this)
	eventBus = new EventEmitter<RTCEventMap>()

	channel!: RTCReactiveState["channel"]

	rtpCapabilities: RtpCapabilities = {}

	logger = logger.child("rtc-core")

	constructor() {
		super({
			initialized: false,
			state: "disconnected",
			channel: null,
			connectedAt: null,
			voiceState: {
				muted: false,
				deafened: false,
			},
			isSpeaking: false,
			statedClients: [],
			remoteProducersIds: [],
			speakingClients: [],
			statedScreens: [],
			statedCameras: [],

			localScreenStreamURL: null,
			localCameraStreamURL: null,

			micProducerId: null,
			cameraProducerId: null,
			screenVideoProducerId: null,
			screenAudioProducerId: null,

			sendTransportState: "disconnected",
			recvTransportState: "disconnected",
		})
	}

	get socket() {
		return client.ws.get("main")
	}

	get userId() {
		return session.user?._id
	}

	get isConnected(): boolean {
		const hasChannelData = !!this.channel
		const hasTransports = !!(this.transports.recv ?? this.transports.send)

		return hasChannelData && hasTransports
	}

	handlers = {
		joinChannel: Bind(this, joinChannel),
		attachChannel: Bind(this, attachChannel),

		leaveChannel: Bind(this, leaveChannel),

		emitClientEvent: Bind(this, emitClientEvent),

		/**
		 * Syncronizes the local voice state with the server
		 */
		syncVoiceState: Bind(this, syncVoiceState),

		/**
		 * Stop and resets the RTC to initial state
		 */
		reset: Bind(this, reset),
	}

	async initialize() {
		if (!this.socket) {
			throw new Error("Cannot initialize RTC without Websocket")
		}

		// set as initialized
		this.setState({
			initialized: true,
		})

		for (const [event, handler] of Object.entries(Events)) {
			this.socket.on(event, Bind(this, handler))
		}

		this.logger.log("rtc loaded!")
	}

	async _handleTransportFailure() {
		logger.error("Transport failure, triggering recovery")
	}
}

export const rtcService = new RTC()

export function useRTCStore(): RTCReactiveState
export function useRTCStore<U>(selector: (state: RTCReactiveState) => U): U
export function useRTCStore<U>(selector?: (state: RTCReactiveState) => U) {
	return rtcService.useStore(selector!)
}

export default useRTCStore
