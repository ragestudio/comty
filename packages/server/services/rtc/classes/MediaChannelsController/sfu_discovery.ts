import type {
	IPC_RegisterNodePayload,
	IPC_UnregisterNodePayload,
} from "@comty/shared/types/rtc"
import type MediaChannelsController from "."

import { EventEmitter } from "tseep/lib/ee-safe"
import { Bucket } from "./kv"
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
				const reg = (await this.kv_bucket.get(
					key,
				)) as IPC_RegisterNodePayload

				if (!reg) continue
				if (!key.startsWith("node.")) continue

				console.log(`[SfuDiscovery] Found stored node: ${reg.node_id}`)

				await this.handleRegNode(reg)
			} catch (err) {
				console.error(
					`[SfuDiscovery] Failed to load entry "${key}":`,
					err,
				)
			}
		}
	}

	getNodeById = (nodeId: bigint): SFUNode | undefined => {
		return this.nodes.find((n) => n.node_id === nodeId)
	}

	handleRegNode = async (payload: IPC_RegisterNodePayload) => {
		if (!payload) return
		if (this.getNodeById(BigInt(payload.node_id))) return

		const node = new SFUNode(
			payload,
			this.controller.server.nats.connection,
		)

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

	handleUnregNode = async (payload: IPC_UnregisterNodePayload) => {
		if (!payload) return

		const node = this.getNodeById(BigInt(payload.node_id))
		if (!node) return

		console.debug(
			`[SfuDiscovery] Unregistering SFU node[${payload.node_id}]`,
		)
		this.nodes = this.nodes.filter(
			(n) => n.node_id !== BigInt(payload.node_id),
		)

		this.emit("unregister", payload)
	}

	async addNodeToBucket(payload: IPC_RegisterNodePayload) {
		if (!this.kv_bucket) return

		const nodeKey = `node.${payload.node_id}`
		await this.kv_bucket.put(nodeKey, payload)
	}

	async deleteNodeToBucket(payload: IPC_UnregisterNodePayload) {
		if (!this.kv_bucket) return

		const nodeKey = `node.${payload.node_id}`
		await this.kv_bucket.delete(nodeKey)
	}
}
