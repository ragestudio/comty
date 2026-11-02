import type {
	SfuNodeRegisterPayload,
	SfuNodeUnregisterPayload,
} from "@comty/shared/types/sfu/index"
import type MediaChannelsController from "."

import { EventEmitter } from "tseep/lib/ee-safe"
import { Bucket } from "@shared-classes/KV"
import { SFUNode } from "./sfu/node"

const BUCKET = "sfu_nodes"

export class SfuNodeDiscovery extends EventEmitter {
	private controller: MediaChannelsController

	kv_bucket: Bucket
	nodes: SFUNode[] = []

	constructor(controller: MediaChannelsController) {
		super()
		this.controller = controller
	}

	async init() {
		if (!this.controller.ipc.controlSub) {
			this.controller.ipc.subscribeToControlSubject()
		}

		this.controller.ipc.on("node_register", this.handleRegNode)
		this.controller.ipc.on("node_unregister", this.handleUnregNode)

		this.kv_bucket = await this.controller.kv.bucket(BUCKET)

		const keys = await this.kv_bucket.keys()

		for await (const key of keys) {
			try {
				const reg = (await this.kv_bucket.get(key)) as SfuNodeRegisterPayload

				if (!reg) continue
				if (!key.startsWith("node.")) continue

				console.log(`[SfuDiscovery] Found stored node: ${reg.node_id}`)

				await this.handleRegNode(reg)
			} catch (err) {
				console.error(`[SfuDiscovery] Failed to load entry "${key}":`, err)
			}
		}
	}

	getNodeById = (nodeId: bigint): SFUNode | undefined => {
		return this.nodes.find((n) => n.node_id === nodeId)
	}

	handleRegNode = async (payload: SfuNodeRegisterPayload) => {
		if (!payload) return

		const existing = this.getNodeById(BigInt(payload.node_id))

		if (existing) {
			// a node can re-register after a restart with the same id
			existing.refName = payload.refName ?? existing.refName
			existing.hostname = payload.hostname ?? existing.hostname
			existing.announced_ip = payload.announced_ip ?? existing.announced_ip
			existing.listens = payload.listens ?? existing.listens
			return
		}

		const node = new SFUNode(payload, this.controller.server.nats.connection)

		if (!(await node.alive())) {
			console.debug(
				`[SfuDiscovery] SFU node[${payload.node_id}] is not alive. Deleting from KV...`,
			)

			await this.deleteNodeToBucket({
				node_id: payload.node_id,
			})

			return
		}

		console.debug(
			`[SfuDiscovery] Registering SFU node[${payload.node_id}] as available`,
		)
		this.nodes.push(node)

		this.emit("register", payload)
	}

	handleUnregNode = async (payload: SfuNodeUnregisterPayload) => {
		if (!payload) return

		const node = this.getNodeById(BigInt(payload.node_id))
		if (!node) return

		console.debug(`[SfuDiscovery] Unregistering SFU node[${payload.node_id}]`)
		this.nodes = this.nodes.filter((n) => n.node_id !== BigInt(payload.node_id))

		this.emit("unregister", payload)
	}

	async addNodeToBucket(payload: SfuNodeRegisterPayload) {
		if (!this.kv_bucket) return

		const nodeKey = `node.${payload.node_id}`
		await this.kv_bucket.put(nodeKey, payload)
	}

	async deleteNodeToBucket(payload: SfuNodeUnregisterPayload) {
		if (!this.kv_bucket) return

		const nodeKey = `node.${payload.node_id}`
		await this.kv_bucket.delete(nodeKey)
	}
}
