import type { NatsEngine } from "@linebridge/engine-nats/engine"

import type {
	SfuNodeEventName,
	SfuNodeEventPayload,
	SfuNodeRegisterPayload,
	SfuNodeUnregisterPayload,
} from "@comty/shared/types/sfu/index"

import { Server } from "linebridge/server"

import { Bucket, KvManager } from "./classes/KV"
import {
	buildListens,
	loadSfuConfig,
	resolveAnnouncedIp,
	type SfuConfig,
} from "./config"
import { MediaWorker } from "./media/MediaWorker"
import { RouterRegistry } from "./media/RouterRegistry"
import { buildRoutes, type SfuRoutes } from "./routes"

import BaseLogger from "@comty/shared/utils/logger"
export const logger = BaseLogger.child("main")

export const SFU_NODES_KV_BUCKET = "sfu_nodes"

export class SfuNode extends Server<"nats"> {
	static useEngine = "nats"
	static useMiddlewares = ["logs"]

	config: SfuConfig
	worker!: MediaWorker
	routers!: RouterRegistry
	kv!: KvManager
	bucket!: Bucket

	declare contexts: {
		config: SfuConfig
		worker: MediaWorker
		routers: RouterRegistry
		kv: KvManager
	}

	routes: SfuRoutes

	constructor() {
		const config = loadSfuConfig()

		super({
			refName: config.refName,
			nats: config.nats,
		})

		this.config = config
		this.routes = buildRoutes(config)
	}

	get natsEngine(): NatsEngine {
		return this.engine as NatsEngine
	}

	get kvId(): string {
		return `node.${this.config.nodeId}`
	}

	notify = <K extends SfuNodeEventName>(
		event: K,
		data: SfuNodeEventPayload<K>,
	) => {
		this.natsEngine.publish(`sfu:ipc:${this.config.nodeId}`, {
			event,
			data,
		})
	}

	async onInitialize(): Promise<void> {
		await resolveAnnouncedIp(this.config)
		buildListens(this.config)

		this.worker = await MediaWorker.create(this.config, () => {
			void this.handleWorkerDied()
		})

		const connection = this.natsEngine.connection

		if (!connection) {
			throw new Error("NATS connection is not available")
		}

		this.kv = new KvManager(connection)
		this.bucket = await this.kv.bucket(this.config.kvBucket)

		this.routers = new RouterRegistry(
			this.worker.worker,
			this.worker.rtcServer,
			this.notify,
			this.config.rtc,
		)

		this.contexts = {
			config: this.config,
			worker: this.worker,
			routers: this.routers,
			kv: this.kv,
		}
	}

	async afterInitialize(): Promise<void> {
		await this.registerNode()
	}

	async onClose(): Promise<void> {
		await this.routers?.closeAll().catch((error) => {
			logger.error("[sfu] failed to close routers", error)
		})

		await this.unregisterNode().catch((error) => {
			logger.error("[sfu] failed to unregister node", error)
		})

		await this.worker?.close().catch((error) => {
			logger.error("[sfu] failed to close worker", error)
		})
	}

	async registerNode(): Promise<void> {
		const payload: SfuNodeRegisterPayload = {
			pid: process.pid.toString(),
			node_id: this.config.nodeId.toString(),
			hostname: this.config.hostname,
			announced_ip: this.config.announcedIp ?? "",
			listens: this.config.listens,
			refName: this.config.refName,
		}

		this.natsEngine.publish("sfu:control", {
			event: "node_register",
			data: payload,
		})

		await this.bucket.put(this.kvId, payload)

		logger.info(
			`[sfu] node ${this.config.nodeId} registered as ${this.config.refName}`,
		)
	}

	async unregisterNode(): Promise<void> {
		if (!this.natsEngine.connection) return

		const payload: SfuNodeUnregisterPayload = {
			pid: process.pid.toString(),
			node_id: this.config.nodeId.toString(),
			hostname: this.config.hostname,
		}

		this.natsEngine.publish("sfu:control", {
			event: "node_unregister",
			data: payload,
		})

		await this.bucket?.delete(this.kvId)
	}

	private async handleWorkerDied(): Promise<void> {
		logger.error("[sfu] worker died")

		await this.unregisterNode().catch((error) => {
			logger.error("[sfu] failed to unregister dead node", error)
		})

		process.exit(1)
	}
}

export default SfuNode
