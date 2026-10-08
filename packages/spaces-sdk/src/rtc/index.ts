import "@comty/shared/utils/index"

import type { Channel } from "@comty/shared/types/spaces/channel"
import type { Client } from "./clients/client"
import type { SerializedScreen } from "./screens/screen"
import type {
	RtpCapabilities,
	RtpCodecCapability,
} from "mediasoup-client/types"

import * as mediasoupClient from "mediasoup-client"
import { EventEmitter } from "tseep"
import BaseStore from "@/classes/BaseStore"
import wsManager from "@/ws"
import session from "@comty/api-lib/session"

import Self from "./self"
import Producers from "./producers"
import Consumers from "./consumers"
import Clients from "./clients"
import Transports from "./transports"
import Screens from "./screens"
import Events from "./events"

import joinChannel from "./handlers/joinChannel"
import leaveChannel from "./handlers/leaveChannel"
import attachChannel from "./handlers/attachChannel"
import syncVoiceState from "./handlers/syncVoiceState"
import reset from "./handlers/reset"

interface RTCReactiveState {
	initialized: boolean
	state: "disconnected" | "loading" | "connecting" | "connected" | "failed"
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
	statedScreens: SerializedScreen[]

	localScreenStreamURL: string | null
	localCameraStreamURL: string | null

	micProducerId: string | null
	cameraProducerId: string | null
	screenVideoProducerId: string | null
	screenAudioProducerId: string | null
}

type InternalEvents = {
	"channel:attached": (data: Channel) => void
	"rtc:vc:soundpad:ended": (payload: any) => any
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
	eventBus = new EventEmitter<InternalEvents>()

	channel!: RTCReactiveState["channel"]

	rtpCapabilities: RtpCapabilities = {}

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

			localScreenStreamURL: null,
			localCameraStreamURL: null,

			micProducerId: null,
			cameraProducerId: null,
			screenVideoProducerId: null,
			screenAudioProducerId: null,
		})
	}

	get socket() {
		return wsManager.socket
	}

	get userId() {
		return session.user._id
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

		console.log("rtc loaded!")
	}

	async _handleTransportFailure() {
		console.error("Transport failure, triggering recovery")
	}
}

export const rtcService = new RTC()

export function useRTCStore(): RTCReactiveState
export function useRTCStore<U>(selector: (state: RTCReactiveState) => U): U
export function useRTCStore<U>(selector?: (state: RTCReactiveState) => U) {
	return rtcService.useStore(selector!)
}

export default useRTCStore
