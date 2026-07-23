import type { KV as NatsKV } from "@nats-io/kv"

const te = new TextEncoder()
const td = new TextDecoder()

export type KvEntry = {
	key: string
	value: Uint8Array
	operation: "PUT" | "DEL" | "PURGE"
}

export type WatchCallback = (entry: KvEntry) => void

export class Bucket {
	constructor(private readonly bucket: NatsKV) {}

	async put<T = unknown>(key: string, value: T) {
		return await this.putRaw(key, JSON.stringify(value))
	}

	async get<T = unknown>(key: string) {
		const value = await this.getRaw(key)
		if (!value) return null

		try {
			return JSON.parse(value) as T
		} catch {
			return null
		}
	}

	async delete(key: string) {
		try {
			await this.bucket.delete(key)
		} catch (err) {
			console.error("[KV] Failed to delete key:", key, err)
		}
	}

	async getRaw(key: string) {
		const raw = await this.bucket.get(key)
		return raw ? td.decode(raw.value) : null
	}

	async putRaw(key: string, value: string) {
		return this.bucket.put(key, te.encode(value))
	}

	keys(): Promise<AsyncIterable<string>> {
		return this.bucket.keys()
	}

	async watch(cb: WatchCallback): Promise<() => void> {
		const iter = await this.bucket.watch()

		void (async () => {
			for await (const entry of iter) {
				try {
					cb({
						key: entry.key,
						value: entry.value,
						operation: entry.operation as KvEntry["operation"],
					})
				} catch (err) {
					console.error(
						`[KV] Failed to process watch callback for key [${entry.key}]:`,
						err,
					)
				}
			}
		})()

		return () => {
			if (typeof iter.stop === "function") iter.stop()
		}
	}
}

export default Bucket
