import type { NatsConnection } from "@nats-io/transport-node"
import type { KV as NatsKV, KvOptions } from "@nats-io/kv"

import { Kvm } from "@nats-io/kv"
import { Bucket } from "./bucket"

export class KvManager {
	private kvm?: Kvm
	private readonly buckets = new Map<string, Bucket>()

	constructor(nc?: NatsConnection) {
		if (nc) {
			this.init(nc)
		}
	}

	init(nc: NatsConnection): void {
		this.kvm = new Kvm(nc)
	}

	async bucket(name: string, options?: Partial<KvOptions>): Promise<Bucket> {
		if (!this.kvm) {
			throw new Error(
				"[KV] Manager is not initialized. Call init() first.",
			)
		}

		if (this.buckets.has(name)) {
			return this.buckets.get(name)!
		}

		let conn: NatsKV
		const opts: Partial<KvOptions> = { compression: true, ...options }

		try {
			conn = await this.kvm.create(name, opts)
			console.log(`[KV] Bucket "${name}" created & opened`)
		} catch {
			conn = await this.kvm.open(name, opts)
			console.log(`[KV] Bucket "${name}" opened`)
		}

		try {
			await conn.get("_probe_")
		} catch (err: any) {
			const isMissingKey =
				err?.code === "KV_KEY_NOT_FOUND" ||
				err?.message?.includes("not found")

			if (!isMissingKey) {
				console.error(`[KV] Failed to probe "${name}":`, err)
			}
		}

		const bucket = new Bucket(conn)
		this.buckets.set(name, bucket)

		return bucket
	}
}

export default KvManager
