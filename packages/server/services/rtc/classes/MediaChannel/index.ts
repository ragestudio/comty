import type { RemoteRouter } from "../MediaChannelsController/sfu/router"
import type { MediaChannelParams, RTCClient } from "../../types"

import { SFUNode } from "@classes/MediaChannelsController/sfu/node"
import EventEmitter from "@foxify/events"

import consumeHandler from "./handlers/consume"
import produceHandler from "./handlers/produce"
import stopProduceHandler from "./handlers/stopProduce"

import joinClientHandler from "./handlers/joinClient"
import leaveClientHandler from "./handlers/leaveClient"

import connectTransportHandler from "./handlers/connectTransport"
import createTransportHandler from "./handlers/createTransport"

import closeHandler from "./handlers/close"
import handleClientEventHandler from "./handlers/clientEvent"

import defaults from "./defaults"
import MediaChannelsController from "@classes/MediaChannelsController"
import { Consumer } from "mediasoup/types"
import type Producer from "./producer"

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

export type SerializedStateMediaChannel = {
	__v: number
	_id: string
	clients: SerializedClient[]
	producers: SerializedProducer[]
	started_at: Date
}

export type SerializedClient = {
	_id: string
	userId: string
	user_id: string
	voice_state: any
	voiceState: any
	user?: {
		_id?: string
		name?: string
		avatar?: string
	}
}

export type SerializedProducer = {
	id: string
	producer_id: string
	user_id: string
	kind: string
	appData: any
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

	joinClient = joinClientHandler.bind(this) as OmitThisParameter<
		typeof joinClientHandler
	>
	leaveClient = leaveClientHandler.bind(this) as OmitThisParameter<
		typeof leaveClientHandler
	>

	createTransport = createTransportHandler.bind(this) as OmitThisParameter<
		typeof createTransportHandler
	>
	connectTransport = connectTransportHandler.bind(this) as OmitThisParameter<
		typeof connectTransportHandler
	>

	produce = produceHandler.bind(this) as OmitThisParameter<
		typeof produceHandler
	>
	stopProduce = stopProduceHandler.bind(this) as OmitThisParameter<
		typeof stopProduceHandler
	>
	consume = consumeHandler.bind(this) as OmitThisParameter<
		typeof consumeHandler
	>

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

	close = closeHandler.bind(this) as OmitThisParameter<typeof closeHandler>

	handleClientEvent = handleClientEventHandler.bind(
		this,
	) as OmitThisParameter<typeof handleClientEventHandler>

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
				voiceState: c.voiceState,
				voice_state: c.voiceState,
				user: {
					_id: c.context.user?._id,
					username: c.context.user?.username,
					avatar: c.context.user?.avatar,
				},
			}
		})
	}

	getProducersSerialized(): SerializedProducer[] {
		const producers = new Set()

		for (const [producerUserId, userProducers] of this.producers) {
			for (const [producerId, producer] of userProducers) {
				producers.add({
					id: producerId,
					producer_id: producerId,
					user_id: producerUserId,
					kind:
						(producer as any).producer?.kind ??
						(producer as any).kind ??
						null,
					appData:
						(producer as any).producer?.appData ??
						(producer as any).appData ??
						null,
				})
			}
		}

		return Array.from(producers) as SerializedProducer[]
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
