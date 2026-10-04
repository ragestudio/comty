import type { Channel } from "@comty/shared/types/spaces/channel"

import * as mediasoupClient from "mediasoup-client"
import { WebsocketClient } from "@linebridge/client"
import { app } from "@/engine/app"
import BaseStore from "../base"

import Self from "./self"
import Producers from "./producers"
import Consumers from "./consumers"
import Clients from "./clients"

import joinChannel from "./handlers/joinChannel"

interface RTCReactiveState {
	initialized: boolean
	connected: boolean
	channel: Channel | null
	channelId: string | null
}

export class RTC extends BaseStore<RTCReactiveState> {
	_socket: WebsocketClient | null = null
	device: mediasoupClient.Device | null = null

	self: Self = new Self(this)
	clients: Clients = new Clients(this)
	producers: Producers = new Producers(this)
	consumers: Consumers = new Consumers(this)

	initialized!: RTCReactiveState["initialized"]
	connected!: RTCReactiveState["connected"]
	channel!: RTCReactiveState["channel"]
	channelId!: RTCReactiveState["channelId"]

	constructor() {
		super({
			initialized: false,
			connected: false,
			channel: null,
			channelId: null,
		})
	}

	get socket() {
		return app.socket
	}

	handlers = {
		joinChannel: joinChannel.bind(this) as OmitThisParameter<
			typeof joinChannel
		>,
	}

	async initialize() {
		// create the device factory
		this.device = await mediasoupClient.Device.factory()

		// TODO: fetch the capabilities and load into the device
		await this.device.load({
			routerRtpCapabilities: {
				codecs: [],
				headerExtensions: [],
			},
		})

		// set as initialized
		this.setState({
			initialized: true,
		})

		console.log("rtc loaded!")
	}
}

export const rtcService = new RTC()

export function useRTCStore(): RTCReactiveState
export function useRTCStore<U>(selector: (state: RTCReactiveState) => U): U
export function useRTCStore<U>(selector?: (state: RTCReactiveState) => U) {
	return rtcService.useStore(selector!)
}

export default useRTCStore
