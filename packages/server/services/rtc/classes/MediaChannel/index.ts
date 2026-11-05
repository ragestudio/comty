import type { RemoteRouter } from "../MediaChannelsController/sfu/router"
import type { MediaChannelParams, RTCClient } from "../../types"
import type { Consumer } from "mediasoup/types"

import type { Client as SerializedClient } from "@comty/shared/types/rtc/client"
import type { SerializedProducer } from "@comty/shared/types/rtc/producer"
import type { StatedChannel as SerializedStateMediaChannel } from "@comty/shared/types/rtc/statedChannel"

import type Producer from "./producer"
import type MediaChannelsController from "@classes/MediaChannelsController"

import Bind from "@comty/shared/utils/bind"
import { getClientUser } from "@shared-utils/clientUser"
import { SFUNode } from "@classes/MediaChannelsController/sfu/node"
import { EventEmitter } from "tseep/lib/ee-safe"
import setFind from "@shared-utils/setFind"

import consumeHandler from "./handlers/consume"
import produceHandler from "./handlers/produce"
import stopProduceHandler from "./handlers/stopProduce"
import stopConsumeHandler from "./handlers/stopConsume"
import consumerControlHandler from "./handlers/consumerControl"

import joinClientHandler from "./handlers/joinClient"
import leaveClientHandler from "./handlers/leaveClient"

import connectTransportHandler from "./handlers/connectTransport"
import createTransportHandler from "./handlers/createTransport"

import closeHandler from "./handlers/close"
import handleClientEventHandler from "./handlers/clientEvent"

import defaults from "./defaults"
import rebindClient from "./rebind"

export type SerializedMediaChannel = {
	controller_id: string | null
	router_id: string | null
	channel_id: string
	sfu_node_id: string
	closed: boolean
	data: any
	clients: SerializedClient[]
	producers: Record<string, Record<string, any>>
	consumers: Record<string, any[]>
	started_at: string
	mediaCodecs: any[]
}

export interface SerializedConsumer extends Partial<Consumer> {
	user_id: string
}

export class MediaChannel {
	controller: MediaChannelsController

	params: MediaChannelParams
	data: any
	channelId: string

	sfu_node: SFUNode
	router: RemoteRouter = null

	mediaCodecs: any[]
	started_at: Date

	closed: boolean = false
	events: EventEmitter = new EventEmitter()

	clients: Set<RTCClient> = new Set()
	producers: Map<string, Map<string, Producer>> = new Map()
	consumers: Map<string, Consumer[]> = new Map()

	constructor(
		params: MediaChannelParams,
		controller: MediaChannelsController,
		sfu_node: SFUNode,
		remoteRouter?: RemoteRouter,
	) {
		this.controller = controller

		if (!this.controller) throw new Error("controller is required")

		this.sfu_node = sfu_node

		if (!this.sfu_node) throw new Error("sfu_node is required")

		if (remoteRouter) {
			this.router = remoteRouter
		}

		this.params = params
		this.data = params.data
		this.channelId = params.channelId

		this.mediaCodecs = params.mediaCodecs || defaults.mediaCodecs
		this.started_at = new Date()
	}

	async initialize() {
		try {
			console.log(`[CHANNEL:${this.channelId}] Initializing`, this.data)

			// if no router provided, create one
			if (!this.router) {
				console.log(
					`[CHANNEL:${this.channelId}] No router provided, creating one`,
				)

				this.router = await this.sfu_node.createRouter({
					channelId: this.channelId,
					groupId: this.data.group_id,
					mediaCodecs: this.mediaCodecs,
				})
			}

			console.log(`[CHANNEL:${this.channelId}] Started`)
			this.events.emit("started", this)

			if (this.controller) {
				this.controller.markInstanceDirty(this.channelId)
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error initializing `,
				error,
			)
			throw error
		}
	}

	joinClient = Bind(this, joinClientHandler)
	leaveClient = Bind(this, leaveClientHandler)
	handleClientEvent = Bind(this, handleClientEventHandler)

	createTransport = Bind(this, createTransportHandler)
	connectTransport = Bind(this, connectTransportHandler)

	produce = Bind(this, produceHandler)
	stopProduce = Bind(this, stopProduceHandler)
	consume = Bind(this, consumeHandler)
	stopConsume = Bind(this, stopConsumeHandler)
	consumerControl = Bind(this, consumerControlHandler)
	close = Bind(this, closeHandler)

	static deserializeMaps(state: SerializedMediaChannel) {
		const producersMap = new Map<string, Map<string, any>>()
		const consumersMap = new Map<string, any[]>()

		if (state.producers) {
			for (const [userId, userProducers] of Object.entries(
				state.producers,
			)) {
				const innerMap = new Map<string, any>()
				for (const [producerId, producerData] of Object.entries(
					userProducers,
				)) {
					innerMap.set(producerId, producerData)
				}
				producersMap.set(userId, innerMap)
			}
		}

		if (state.consumers) {
			for (const [consumerId, consumers] of Object.entries(
				state.consumers,
			)) {
				consumersMap.set(consumerId, consumers)
			}
		}

		return { producers: producersMap, consumers: consumersMap }
	}

	async handleSoundpadDispatch(client: RTCClient, payload: any) {
		this.broadcastToClients(`media:channel:soundpad:dispatch`, {
			userId: client.userId,
			data: payload,
		})
	}

	updateClientVoiceState(client: RTCClient, update: any) {
		for (const c of this.clients) {
			if (c.userId === client.userId) {
				c.voiceState = {
					...c.voiceState,
					...update,
				}
			}
		}

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}
	}

	/**
	 * Route future events of an already joined client to its current socket.
	 * A websocket reconnection creates a new session, the runtime state
	 * (transports, voice state) must be preserved while emissions use the new
	 * connection.
	 */
	rebindClient = Bind(this, rebindClient)

	_setupTransportEvents(transport: any, client: RTCClient) {
		transport.on("dtlsstatechange", (dtlsState: string) => {
			console.log(
				`[CHANNEL:${this.channelId}] Transport ${transport.id} DTLS state: ${dtlsState}`,
			)
		})

		transport.on("iceconnectionstatechange", (iceState: string) => {
			console.log(
				`[CHANNEL:${this.channelId}] Transport ${transport.id} ICE state: ${iceState}`,
			)
		})

		transport.on("@close", () => {
			if (client.transports) {
				client.transports.delete(transport.id)
			}
		})
	}

	_setupConsumerEvents(consumer: any, client: RTCClient) {
		consumer.on("transportclose", () => {
			console.log(`[CHANNEL:${this.channelId}] consumer transport closed`)
		})

		consumer.on("producerclose", () => {
			console.log(`[CHANNEL:${this.channelId}] consumer producer closed`)
		})
	}

	getConnectedClientsUserIds(): string[] {
		return Array.from(this.clients).map((c) => c.userId)
	}

	getConnectedClientsSerialized(): SerializedClient[] {
		return Array.from(this.clients).map((c) => {
			return {
				_id: c.userId,
				userId: c.userId,
				user_id: c.userId,
				channel_id: this.channelId,
				voiceState: c.voiceState,
				voice_state: c.voiceState,
				user: getClientUser(c) ?? { _id: c.userId },
			}
		})
	}

	getProducersSerialized(): SerializedProducer[] {
		const producers: SerializedProducer[] = []

		for (const [producerUserId, userProducers] of this.producers) {
			for (const [producerId, producer] of userProducers) {
				// live producers expose serialize(), restored ones are already
				// serialized objects
				const serialized =
					typeof (producer as any).serialize === "function"
						? (producer as any).serialize()
						: (producer as any)

				producers.push({
					id: serialized.id ?? producerId,
					producerId: serialized.producerId ?? producerId,
					channelId: serialized.channelId ?? this.channelId,
					groupId: serialized.groupId ?? this.data?.group_id,
					userId: serialized.userId ?? producerUserId,
					kind: serialized.kind ?? null,
					appData: serialized.appData ?? null,
				})
			}
		}

		return producers
	}

	serialize = (): SerializedMediaChannel => {
		// convert producers Map to JSON-compatible Record
		const producers: Record<string, Record<string, any>> = {}
		for (const [userId, userProducers] of this.producers) {
			producers[userId] = {}
			for (const [producerId, producer] of userProducers) {
				// if already serialized (from state reconstruction), use as-is
				producers[userId][producerId] =
					typeof producer.serialize === "function"
						? producer.serialize()
						: producer
			}
		}

		// convert consumers Map to JSON-compatible Record
		const consumers: Record<string, any[]> = {}
		for (const [consumerId, consumerList] of this.consumers) {
			consumers[consumerId] = consumerList.map((c) => ({
				user_id: (c as any).user_id || "",
				id: c.id,
				kind: c.kind,
				appData: c.appData,
				producerId: c.producerId,
				rtpParameters: c.rtpParameters,
				type: c.type,
				paused: c.paused,
				score: c.score,
				producerPaused: c.producerPaused,
				preferredLayers: c.preferredLayers,
				currentLayers: c.currentLayers,
			}))
		}

		return {
			router_id: this.router?.id ?? null,
			controller_id: this.controller?.controller_id ?? null,
			channel_id: this.channelId,
			sfu_node_id: this.sfu_node.node_id.toString(),
			closed: this.closed,
			started_at: this.started_at.toISOString(),
			data: this.data,
			mediaCodecs: this.mediaCodecs,
			clients: this.getConnectedClientsSerialized(),
			producers,
			consumers,
		}
	}

	serialized_state(): SerializedStateMediaChannel {
		return {
			__v: this.data.__v,
			_id: this.data._id,
			clients: this.getConnectedClientsSerialized(),
			producers: this.getProducersSerialized(),
			started_at: this.started_at,
		}
	}

	/**
	 * Send a event to all clients except the one provided
	 * @param {Object<RTCClient>} client Origin client client
	 * @param {string} event The event name
	 * @param {Object} payload The payload object to send
	 */
	async sendToClients(client: RTCClient, event: string, payload: any) {
		try {
			const otherClients = Array.from(this.clients).filter(
				(c) => c.userId !== client.userId,
			)

			for (const otherClient of otherClients) {
				if (otherClient.staled || !otherClient.emit) {
					continue
				}

				await otherClient.emit(event, payload)
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error broadcasting to clients for [${client.userId}]:`,
				error,
			)
		}
	}

	/**
	 * Broadcast an event to all clients
	 * @param {string} event
	 * @param {Object} payload
	 */
	async broadcastToClients(event: string, payload: any) {
		try {
			for (const client of this.clients) {
				if (client.staled || !client.emit) {
					continue
				}

				await client.emit(event, payload)
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error broadcasting to clients`,
				error,
			)
		}
	}
}

export default MediaChannel
