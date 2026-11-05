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
import logger from "@comty/shared/utils/logger"

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
export { default as parseTransportStats } from "./utils/parseTransportStats"
export type {
	ParsedTransportStats,
	TransportCandidate,
} from "./utils/parseTransportStats"

type ConnState =
	"disconnected" | "loading" | "connecting" | "connected" | "failed"

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
	localScreenStream: MediaStream | null
	localCameraStream: MediaStream | null

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

	private recoveringFromTransportFailure = false

	private rebinding = false
	private socketWatcherBound = false

	// socket the events are bound to, so initializing the service more than
	// once does not register the handlers multiple times
	private eventsSocket: any = null

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
			localScreenStream: null,
			localCameraStream: null,

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
		const socket = this.socket

		if (!socket) {
			throw new Error("Cannot initialize RTC without Websocket")
		}

		// the app may initialize the service more than once, binding the
		// handlers again would dispatch every event multiple times
		if (this.eventsSocket === socket) return

		// set as initialized
		this.setState({
			initialized: true,
		})

		for (const [event, handler] of Object.entries(Events)) {
			socket.on(event, Bind(this, handler))
		}

		// a reconnection keeps the same socket instance but a new server session
		socket.on("reconnected", this._handleSocketReconnected)

		this.eventsSocket = socket
		this.bindSocketWatcher()

		this.logger.log("rtc loaded!")
	}

	// the socket is recreated after a logout or an origin change, the rtc
	// handlers must be bound to the new instance
	private bindSocketWatcher() {
		if (this.socketWatcherBound) return

		this.socketWatcherBound = true

		client.eventBus.on("wsmanager:main:open", () => {
			const socket = this.socket

			if (!socket || socket === this.eventsSocket) return

			this.initialize().catch((error) =>
				this.logger.error("Failed to rebind rtc handlers", error),
			)
		})
	}

	// reattach the media session to the server after a socket reconnection, the
	// server keeps the transports but the previous socket is gone so direct
	// events (soundpad, producers, client changes) would be dropped
	private _handleSocketReconnected = async (): Promise<void> => {
		if (!this.channel) return
		if (this.rebinding) return

		this.rebinding = true

		try {
			const socket = this.socket

			if (!socket) return

			const state = await socket.call<any>("channel:rebind")

			if (!state?.ok) {
				this.logger.warn(
					"Media channel is no longer available, resetting rtc state",
				)

				await this.handlers.reset()
				this.eventBus.emit("rtc:channel:disconnected", {
					reason: "socket_reconnected",
				})

				return
			}

			await this._reconcileRemoteState(state)
			this.handlers.syncVoiceState()

			this.logger.log("rtc session rebound after socket reconnection")
		} catch (error) {
			this.logger.error("Failed to rebind rtc session", error)
		} finally {
			this.rebinding = false
		}
	}

	// recover from events lost during the disconnection window: drop remote
	// producers that no longer exist and consume the ones that appeared
	private async _reconcileRemoteState(state: {
		clients?: any[]
		producers?: any[]
	}) {
		const producers = Array.isArray(state.producers) ? state.producers : []
		const clients = Array.isArray(state.clients) ? state.clients : []

		const activeProducers = new Set(
			producers
				.map((producer) => producer?.producerId ?? producer?.id)
				.filter(Boolean),
		)

		for (const producer of Array.from(this.producers.values())) {
			if (producer.self) continue
			if (activeProducers.has(producer.producerId)) continue

			await this._dropRemoteProducer(producer)
		}

		const activeClients = new Set(
			clients.map((client: any) => client?.userId).filter(Boolean),
		)

		for (const userId of Array.from(this.clients.keys())) {
			if (activeClients.has(userId)) continue

			await this.clients.leave(userId)
		}

		await this.clients.restore({ ...state, clients, producers } as any)
	}

	private async _dropRemoteProducer(producer: any) {
		this.producers.delRemote(producer)

		await this.consumers.stopByProducerId(producer.producerId)

		const client = this.clients.get(producer.userId)
		const mediaTag = producer.appData?.mediaTag

		if (!client || !mediaTag) return

		if (mediaTag === "user-mic") {
			await client.dettachMic(producer.producerId)
			return
		}

		if (mediaTag === "user-cam") {
			await this.cameras.removeProducer(
				producer.userId,
				"video",
				producer.producerId,
			)
			return
		}

		if (mediaTag === "screen-video") {
			await this.screens.removeProducer(
				producer.userId,
				"video",
				producer.producerId,
			)
			return
		}

		if (mediaTag === "screen-audio") {
			await this.screens.removeProducer(
				producer.userId,
				"audio",
				producer.producerId,
			)
		}
	}

	async _handleTransportFailure() {
		if (this.recoveringFromTransportFailure) return

		this.recoveringFromTransportFailure = true

		logger.error("Transport failure, leaving the channel")

		try {
			if (this.socket) {
				await this.handlers.leaveChannel()
			} else {
				// without a socket there is nothing to notify, just release the media
				await this.handlers.reset()
			}
		} catch (error) {
			logger.error("Failed to leave the failed channel", error)

			await this.handlers
				.reset()
				.catch((resetError) =>
					logger.error("Failed to reset the failed channel", resetError),
				)
		} finally {
			this.recoveringFromTransportFailure = false
		}

		this.eventBus.emit("rtc:channel:disconnected", {
			reason: "transport_failed",
		})
	}
}

export const rtcService = new RTC()

export function useRTCStore(): RTCReactiveState
export function useRTCStore<U>(selector: (state: RTCReactiveState) => U): U
export function useRTCStore<U>(selector?: (state: RTCReactiveState) => U) {
	return rtcService.useStore(selector!)
}

export default useRTCStore
