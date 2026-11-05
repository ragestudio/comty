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
import detachHandler from "./handlers/detach"
import handleClientEventHandler from "./handlers/clientEvent"

import defaults from "./defaults"
import rebindClient from "./rebind"

// owner that wrote the state, used as fencing token when restoring it
export type SerializedMediaChannelOwnership = {
	controller_id: string
	node_id: string
	epoch: number
}

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
	ownership?: SerializedMediaChannelOwnership
	// last time the owner refreshed the state, used to detect orphans
	flushed_at?: number
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
	// ownership epoch this instance was created or restored with
	ownershipEpoch: number = 0
	// last time the instance received activity, used to reap idle channels
	lastActivityAt: number = Date.now()
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
			console.error(`[CHANNEL:${this.channelId}] Error initializing `, error)
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
	// local teardown that keeps the shared state and the sfu router untouched
	detach = Bind(this, detachHandler)

	static deserializeMaps(state: SerializedMediaChannel) {
		const producersMap = new Map<string, Map<string, any>>()
		const consumersMap = new Map<string, any[]>()

		if (state.producers) {
			for (const [userId, userProducers] of Object.entries(state.producers)) {
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
			for (const [consumerId, consumers] of Object.entries(state.consumers)) {
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

	/**
	 * Closes a producer of the channel. Live entries wrap a mediasoup producer,
	 * restored ones are plain data and the media only lives on the sfu node.
	 */
	async closeProducerEntry(
		userId: string,
		producerId: string,
	): Promise<boolean> {
		const userProducers = this.producers.get(userId)

		if (!userProducers) return false

		const entry: any = userProducers.get(producerId)

		if (!entry) return false

		if (entry.producer && typeof entry.producer.close === "function") {
			if (!entry.producer.closed) {
				await entry.producer.close()
			}

			if (typeof entry.onProducerClose === "function") {
				await entry.onProducerClose()
			}
		} else {
			// restored producer, release the media on the sfu and notify the group
			await this.closeRemoteProducer(producerId)

			userProducers.delete(producerId)

			this.events.emit("producer:close", this.producerView(userId, entry))
		}

		if (userProducers.size === 0) {
			this.producers.delete(userId)
		}

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}

		return true
	}

	/**
	 * Closes a consumer of the channel. Restored consumers are plain data, the
	 * sfu node drops them with the transport or the router.
	 */
	async closeConsumerEntry(
		userId: string,
		consumerId: string,
	): Promise<boolean> {
		const userConsumers = this.consumers.get(userId)

		if (!Array.isArray(userConsumers)) return false

		const index = userConsumers.findIndex(
			(consumer: any) => consumer?.id === consumerId,
		)

		if (index === -1) return false

		const consumer: any = userConsumers[index]

		if (consumer && typeof consumer.close === "function" && !consumer.closed) {
			consumer.close()
		}

		userConsumers.splice(index, 1)

		if (userConsumers.length === 0) {
			this.consumers.delete(userId)
		}

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}

		return true
	}

	/** asks the sfu node to close a producer that is not in memory anymore */
	async closeRemoteProducer(producerId: string) {
		try {
			await this.sfu_node.request("closeProducer", {
				producer_id: producerId,
			})
		} catch (error) {
			// the sfu may have closed it already
		}
	}

	/** producer shaped object for a restored (plain serialized) entry */
	private producerView(userId: string, entry: any) {
		const client: any = setFind(
			this.clients,
			(c: RTCClient) => c.userId === userId,
		) ?? {
			userId,
			context: { user: { _id: userId } },
		}

		return {
			client,
			channelId: this.channelId,
			serialize: () => ({
				id: entry.id ?? entry.producerId,
				producerId: entry.producerId ?? entry.id,
				channelId: this.channelId,
				groupId: entry.groupId ?? this.data?.group_id,
				userId: userId,
				kind: entry.kind ?? null,
				appData: entry.appData ?? null,
			}),
		}
	}

	/**
	 * Replaces a restored placeholder with the live client of the same user.
	 * Returns false when there is nothing to bind.
	 */
	bindClient(client: RTCClient): boolean {
		// only a local client with a real socket can replace a restored entry,
		// synthesized proxies are rebuilt on every remote call
		if (!(client as any).socket) return false

		const current = setFind(
			this.clients,
			(c: RTCClient) => c.userId === client.userId,
		)

		if (!current || !current.staled) return false

		client.channel_id = this.channelId
		client.voiceState = current.voiceState ?? client.voiceState

		// the transports of a restored client still exist on the sfu node,
		// keep their proxies so the media session keeps working
		if (!client.transports) {
			client.transports = current.transports ?? new Map()
		}

		this.clients.delete(current)
		this.clients.add(client)

		return true
	}

	getConnectedClientsSerialized(
		includeTransports: boolean = false,
	): SerializedClient[] {
		return Array.from(this.clients).map((c) => {
			const serialized: SerializedClient & {
				_id: string
				user_id: string
				voice_state: any
			} = {
				_id: c.userId,
				userId: c.userId,
				user_id: c.userId,
				channel_id: this.channelId,
				voiceState: c.voiceState,
				voice_state: c.voiceState,
				user: getClientUser(c) ?? { _id: c.userId },
			}

			if (includeTransports && c.transports) {
				serialized.transports = Array.from(c.transports.keys())
			}

			return serialized
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
			// transports are needed to keep producing after a restore
			clients: this.getConnectedClientsSerialized(true),
			producers,
			consumers,
			ownership: this.controller
				? {
						controller_id: this.controller.controller_id,
						node_id: this.controller.nodeId,
						epoch: this.ownershipEpoch,
					}
				: undefined,
			flushed_at: Date.now(),
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
				// restored clients emit through the cluster, the socket
				// reference is not required
				if (!otherClient.emit) {
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
				if (!client.emit) {
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
