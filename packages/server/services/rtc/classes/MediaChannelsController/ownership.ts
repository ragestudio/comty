import type { Bucket } from "@shared-classes/KV"

/**
 * A voice channel is served by exactly one controller. The claim lives in a
 * KV bucket so any node can find the owner before creating a second instance
 * of the same channel.
 */
export type ChannelOwner = {
	controller_id: string
	node_id: string
	updated_at: number
}

// an owner that stopped renewing for this long is considered gone
export const OWNERSHIP_TTL_MS = 30_000
// how often a live controller renews the channels it owns
export const OWNERSHIP_RENEW_MS = 10_000

const KEY_PREFIX = "channel."

export class ChannelOwnership {
	controller_id: string
	node_id: string
	bucket: Bucket | null = null

	// revision of the entry this controller wrote, needed for compare and swap
	private revisions = new Map<string, number>()

	constructor(controller_id: string, node_id: string) {
		this.controller_id = controller_id
		this.node_id = node_id
	}

	async init(bucket: Bucket) {
		this.bucket = bucket
	}

	private key(channelId: string) {
		return KEY_PREFIX + channelId
	}

	private payload(): ChannelOwner {
		return {
			controller_id: this.controller_id,
			node_id: this.node_id,
			updated_at: Date.now(),
		}
	}

	private isAlive(owner: ChannelOwner) {
		return Date.now() - owner.updated_at < OWNERSHIP_TTL_MS
	}

	/** returns the live owner of a channel, null when free or stale */
	async resolve(channelId: string): Promise<ChannelOwner | null> {
		if (!this.bucket) return null

		const entry = await this.bucket.getEntry<ChannelOwner>(this.key(channelId))

		if (!entry || !this.isAlive(entry.value)) {
			return null
		}

		return entry.value
	}

	/**
	 * claims a channel for this controller, or returns the current owner
	 * the operation is safe to run concurrently from several nodes
	 */
	async claim(channelId: string): Promise<ChannelOwner> {
		if (!this.bucket) {
			return this.payload()
		}

		const existing = await this.bucket.getEntry<ChannelOwner>(
			this.key(channelId),
		)

		if (existing) {
			// the same node already owns it, adopt it after a restart
			if (existing.value.node_id === this.node_id) {
				try {
					const revision = await this.bucket.update(
						this.key(channelId),
						this.payload(),
						existing.revision,
					)

					this.revisions.set(channelId, revision)
					return this.payload()
				} catch {
					return (await this.resolve(channelId)) ?? this.payload()
				}
			}

			if (this.isAlive(existing.value)) {
				return existing.value
			}

			// stale owner, take it over only if nobody else moved first
			try {
				const revision = await this.bucket.update(
					this.key(channelId),
					this.payload(),
					existing.revision,
				)

				this.revisions.set(channelId, revision)
				return (await this.resolve(channelId)) ?? this.payload()
			} catch {
				return (await this.resolve(channelId)) ?? this.payload()
			}
		}

		try {
			const revision = await this.bucket.create(
				this.key(channelId),
				this.payload(),
			)

			this.revisions.set(channelId, revision)
			return this.payload()
		} catch {
			// another controller created it first
			return (await this.resolve(channelId)) ?? this.payload()
		}
	}

	/** keeps the claim alive, returns false when it was taken over */
	async renew(channelId: string): Promise<boolean> {
		if (!this.bucket) return true

		let revision = this.revisions.get(channelId)

		if (revision === undefined) {
			const entry = await this.bucket.getEntry<ChannelOwner>(
				this.key(channelId),
			)

			// a restarted controller reuses the claim of its own node
			if (entry?.value.node_id !== this.node_id) {
				return false
			}

			revision = entry.revision
		}

		try {
			const next = await this.bucket.update(
				this.key(channelId),
				this.payload(),
				revision,
			)

			this.revisions.set(channelId, next)
			return true
		} catch {
			this.revisions.delete(channelId)
			return false
		}
	}

	async renewAll(channelIds: Iterable<string>): Promise<void> {
		const ids = Array.from(channelIds)

		await Promise.allSettled(ids.map((id) => this.renew(id)))
	}

	/** removes the claim when the channel closes */
	async release(channelId: string): Promise<void> {
		if (!this.bucket) return

		this.revisions.delete(channelId)

		const entry = await this.bucket.getEntry<ChannelOwner>(this.key(channelId))

		if (entry?.value.controller_id !== this.controller_id) {
			return
		}

		await this.bucket.delete(this.key(channelId))
	}
}

export default ChannelOwnership
