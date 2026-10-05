import type { Channel } from "@comty/shared/types/spaces/channel"

import * as mediasoupClient from "mediasoup-client"
import { WebsocketClient } from "@linebridge/client/src"
import BaseStore from "../base"

import Self from "./self"
import Producers from "./producers"
import Consumers from "./consumers"
import Clients from "./clients"
import Transports from "./transports"

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
	isMuted: boolean
	isDeafened: boolean
}

export class RTC extends BaseStore<RTCReactiveState> {
	_socket_getter: () => WebsocketClient | null = () => null
	_userId_getter: () => string | null | undefined = () => null

	device: mediasoupClient.Device | null = null

	self: Self = new Self(this)
	clients: Clients = new Clients(this)
	producers: Producers = new Producers(this)
	consumers: Consumers = new Consumers(this)
	transports: Transports = new Transports(this)

	initialized!: RTCReactiveState["initialized"]
	state!: RTCReactiveState["state"]
	channel!: RTCReactiveState["channel"]
	isMuted!: RTCReactiveState["isMuted"]
	isDeafened!: RTCReactiveState["isDeafened"]
	connectedAt!: RTCReactiveState["connectedAt"]

	constructor() {
		super({
			initialized: false,
			state: "disconnected",
			channel: null,
			connectedAt: null,
			isMuted: false,
			isDeafened: false,
		})
	}

	get socket() {
		return this._socket_getter()
	}

	get userId() {
		return this._userId_getter()
	}

	handlers = {
		joinChannel: Bind(this, joinChannel),
		leaveChannel: Bind(this, leaveChannel),
		attachChannel: Bind(this, attachChannel),
		syncVoiceState: Bind(this, syncVoiceState),
		reset: Bind(this, reset),
	}

	get isConnected(): boolean {
		const hasChannelData = !!this.channel
		const hasTransports = !!(this.transports.recv ?? this.transports.send)

		return hasChannelData && hasTransports
	}

	bind = (
		socket: typeof this._socket_getter,
		userId: typeof this._userId_getter,
	) => {
		this._socket_getter = socket
		this._userId_getter = userId
	}

	async initialize() {
		// set as initialized
		this.setState({
			initialized: true,
		})

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
