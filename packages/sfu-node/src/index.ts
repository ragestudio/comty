import type { Transport, TransportListenInfo } from "mediasoup/types"
import type {
	IPC_RegisterNodePayload,
	IPC_UnregisterNodePayload,
} from "@comty/shared/types/rtc"

import { connect, NatsConnection } from "@nats-io/transport-node"
import * as mediasoup from "mediasoup"
import { asyncExitHook } from "exit-hook"
import os from "node:os"

import IPC from "./ipc"
import { Worker as SnowflakeWorker } from "./classes/Snowflake"
import { getDnsPublicIP } from "./utils/resolvePublicIp"

import base_handler from "./base_handler"
import * as handlers from "./handlers"
import { Bucket, KvManager } from "./classes/KV"

export const SFU_NODES_KV_BUCKET = "sfu_nodes"

export class SFU_Node {
	snowflake: SnowflakeWorker = new SnowflakeWorker()
	worker!: mediasoup.types.Worker
	rtc_server!: mediasoup.types.WebRtcServer

	kv_manager: KvManager = new KvManager()
	kv_sfu_nodes_bucket: Bucket

	node_id!: bigint
	hostname!: string
	announced_ip: string
	listens: TransportListenInfo[] = []
	appData: Record<string, unknown> = {}
	start_time!: number

	nats!: NatsConnection
	nats_adapter!: IPC

	routers: Map<string | symbol, mediasoup.types.Router> = new Map()
	transports: Map<string, mediasoup.types.Transport> = new Map()
	producers: Map<string, mediasoup.types.Producer> = new Map()
	consumers: Map<string, mediasoup.types.Consumer> = new Map()

	get sfuNodeKVId() {
		return `node.${this.node_id}`
	}

	async registerNode() {
		if (!this.nats) return

		const payload: IPC_RegisterNodePayload = {
			pid: process.pid.toString(),
			node_id: this.node_id.toString(),
			hostname: this.hostname,
			announced_ip: this.announced_ip?.toString() ?? "",
			listens: this.listens,
		}

		this.nats_adapter.publish_to_control("node_register", payload)
		await this.kv_sfu_nodes_bucket.put(this.sfuNodeKVId, payload)
	}

	async unregisterNode() {
		if (!this.nats) return

		const payload: IPC_UnregisterNodePayload = {
			pid: process.pid.toString(),
			node_id: this.node_id.toString(),
			hostname: this.hostname,
		}

		this.nats_adapter.publish_to_control("node_unregister", payload)
		await this.kv_sfu_nodes_bucket.delete(this.sfuNodeKVId)
	}

	handlers = {
		alive: handlers.alive,
		getRouter: handlers.getRouter,
		createRouter: handlers.createRouter,
		listRouters: handlers.listRouters,
		closeRouter: handlers.closeRouter,
		createRouterWebRtcTransport: handlers.createRouterWebRtcTransport,
		routerCanConsume: handlers.routerCanConsume,
		connectTransport: handlers.connectTransport,
		produce: handlers.produce,
		consume: handlers.consume,
		closeTransport: handlers.closeTransport,
		closeProducer: handlers.closeProducer,
		closeConsumer: handlers.closeConsumer,
		requestKeyFrame: handlers.requestKeyFrame,
	}

	setupTransportEvents(transport: Transport) {
		transport.on("@close", () => {
			this.transports.delete(transport.id)
			this.nats_adapter.publish("transport_closed", {
				transport_id: transport.id,
			})
		})
	}

	setupProducerEvents(producer: mediasoup.types.Producer) {
		producer.observer.on("close", () => {
			this.producers.delete(producer.id)
			this.nats_adapter.publish("producer_closed", {
				producer_id: producer.id,
			})
		})

		producer.on("transportclose", () => {
			this.producers.delete(producer.id)
			this.nats_adapter.publish("producer_closed", {
				producer_id: producer.id,
			})
		})
	}

	setupConsumerEvents(consumer: mediasoup.types.Consumer) {
		consumer.observer.on("close", () => {
			this.consumers.delete(consumer.id)
			this.nats_adapter.publish("consumer_closed", {
				consumer_id: consumer.id,
			})
		})

		consumer.on("transportclose", () => {
			this.consumers.delete(consumer.id)
			this.nats_adapter.publish("consumer_closed", {
				consumer_id: consumer.id,
			})
		})

		consumer.on("producerclose", () => {
			this.consumers.delete(consumer.id)
			this.nats_adapter.publish("consumer_closed", {
				consumer_id: consumer.id,
			})
		})
	}

	async onExit(signal: number) {
		console.log("Exiting with signal:", signal)
		this.unregisterNode()
	}

	async initialize() {
		const { NATS_ADDRESS } = process.env

		if (!NATS_ADDRESS) {
			throw new Error("NATS_ADDRESS not set")
		}

		asyncExitHook(this.onExit.bind(this), {
			wait: 1000,
		})

		this.nats = await connect({
			servers: [NATS_ADDRESS],
		})

		console.log("NATS connected to:", NATS_ADDRESS)
		console.log(this.nats.getServers())

		// initialize KV manager & open SFU nodes bucket
		this.kv_manager.init(this.nats)
		this.kv_sfu_nodes_bucket =
			await this.kv_manager.bucket(SFU_NODES_KV_BUCKET)

		this.node_id = this.snowflake.nextId()
		this.appData["node_id"] = this.node_id.toString()
		console.log("Node ID:", this.appData["node_id"])

		this.hostname = os.hostname()
		this.appData["hostname"] = this.hostname
		console.log("Hostname:", this.appData["hostname"])

		this.announced_ip = await getDnsPublicIP()
		console.log("Announced SFU IP:", this.announced_ip)

		this.listens.push({
			protocol: "udp",
			ip: "0.0.0.0",
			announcedIp: this.announced_ip,
			port: 40001,
		})
		this.listens.push({
			protocol: "tcp",
			ip: "0.0.0.0",
			announcedIp: this.announced_ip,
			port: 40001,
		})

		this.worker = await mediasoup.createWorker({
			logLevel: "warn",
			logTags: [
				"info",
				"ice",
				"dtls",
				"rtp",
				"srtp",
				"rtcp",
				"rtx",
				"bwe",
				"score",
				"simulcast",
				"svc",
			],
		})

		this.worker.on("died", this.events.died)
		this.worker.on("listenererror", this.events.listenererror)

		this.rtc_server = await this.worker.createWebRtcServer({
			listenInfos: this.listens,
			appData: this.appData,
		})
		this.start_time = Date.now()

		this.nats_adapter = new IPC(this)

		for (const eventKey in this.handlers) {
			this.nats_adapter.on(
				eventKey,
				base_handler(this.handlers[eventKey].bind(this)).bind(this),
			)
		}

		await this.registerNode()

		console.log("WebRTC server listening on", this.listens)
	}

	events = {
		died: () => {
			console.log("Worker died")
			process.exit(1)
		},
		listenererror: () => {
			console.log("Worker listener error")
		},
	}
}

export default SFU_Node
