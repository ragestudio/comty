import type { Bucket } from "@shared-classes/KV"

/**
 * A voice channel is served by exactly one controller. The claim lives in a
 * KV bucket so any node can find the owner before creating a second instance
 * of the same channel.
 *
 * `epoch` is a fencing token: it is bumped every time the claim changes hands
 * and the persisted session keeps the epoch it was written with. A controller
 * only adopts a session written by an epoch it owns or inherited, so a node
 * that lost the claim cannot revive an obsolete media session.
 */
export type ChannelOwner = {
	controller_id: string
	node_id: string
	epoch: number
	updated_at: number
}

export type ChannelClaim = {
	// true when this controller won the claim
	owned: boolean
	owner: ChannelOwner
}

// an owner that stopped renewing for this long is considered gone
export const OWNERSHIP_TTL_MS = 30_000
// how often a live controller renews the channels it owns
export const OWNERSHIP_RENEW_MS = 10_000

const KEY_PREFIX = "channel."
const CLAIM_ATTEMPTS = 3

export class ChannelOwnership {
	controller_id: string
	node_id: string
	bucket: Bucket | null = null

	// revision of the entry this controller wrote, needed for compare and swap
	private revisions = new Map<string, number>()
	// epoch this controller owns for each channel
	private epochs = new Map<string, number>()

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

	private payload(epoch: number): ChannelOwner {
		return {
			controller_id: this.controller_id,
			node_id: this.node_id,
			epoch,
			updated_at: Date.now(),
		}
	}

	private isAlive(owner: ChannelOwner) {
		return Date.now() - owner.updated_at < OWNERSHIP_TTL_MS
	}

	/**
	 * true when this controller started after the other one. controller ids
	 * are snowflakes, so the newest process always wins a same node conflict
	 */
	private isNewerController(other: string): boolean {
		try {
			return BigInt(this.controller_id) > BigInt(other)
		} catch {
			return this.controller_id > other
		}
	}

	private remember(channelId: string, epoch: number, revision: number) {
		this.epochs.set(channelId, epoch)
		this.revisions.set(channelId, revision)
	}

	private forget(channelId: string) {
		this.epochs.delete(channelId)
		this.revisions.delete(channelId)
	}

	/** epoch this controller currently owns for a channel */
	epochOf(channelId: string): number | null {
		return this.epochs.get(channelId) ?? null
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
	 * claims a channel for this controller, or returns the current owner.
	 * the operation is safe to run concurrently from several nodes
	 */
	async claim(channelId: string): Promise<ChannelClaim> {
		if (!this.bucket) {
			// without a bucket the node keeps the epoch in memory
			const epoch = this.epochs.get(channelId) ?? 1

			this.epochs.set(channelId, epoch)

			return { owned: true, owner: this.payload(epoch) }
		}

		const key = this.key(channelId)

		for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
			const existing = await this.bucket.getEntry<ChannelOwner>(key)

			// free channel, first writer wins
			if (!existing) {
				try {
					const revision = await this.bucket.create(key, this.payload(1))
					this.remember(channelId, 1, revision)

					return { owned: true, owner: this.payload(1) }
				} catch {
					continue
				}
			}

			const current = existing.value
			const epoch = Number(current.epoch ?? 0)

			// already ours, just refresh the timestamp
			if (current.controller_id === this.controller_id) {
				try {
					const revision = await this.bucket.update(
						key,
						this.payload(epoch),
						existing.revision,
					)

					this.remember(channelId, epoch, revision)

					return { owned: true, owner: this.payload(epoch) }
				} catch {
					continue
				}
			}

			// a live owner keeps the channel. on the same node only the newest
			// controller may take it, otherwise two live processes would steal
			// channels from each other in a loop
			if (this.isAlive(current)) {
				const isSameNode = current.node_id === this.node_id

				if (!isSameNode || !this.isNewerController(current.controller_id)) {
					return { owned: false, owner: current }
				}
			}

			// stale owner or a newer controller on the same node, take it over
			// with a new epoch so the old one is fenced out
			const nextEpoch = epoch + 1

			try {
				const revision = await this.bucket.update(
					key,
					this.payload(nextEpoch),
					existing.revision,
				)

				this.remember(channelId, nextEpoch, revision)

				return { owned: true, owner: this.payload(nextEpoch) }
			} catch {
				continue
			}
		}

		// another controller won the race in each attempt
		const current = await this.resolve(channelId)

		if (current && current.controller_id === this.controller_id) {
			return { owned: true, owner: current }
		}

		if (current) {
			return { owned: false, owner: current }
		}

		return { owned: false, owner: this.payload(0) }
	}

	/** keeps the claim alive, returns false when it was lost */
	async renew(channelId: string): Promise<boolean> {
		if (!this.bucket) return true

		const epoch = this.epochs.get(channelId)

		// ownership was never recorded by this controller
		if (epoch === undefined) return false

		const key = this.key(channelId)

		for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
			let entry: { value: ChannelOwner; revision: number } | null

			try {
				entry = await this.bucket.readEntry<ChannelOwner>(key)
			} catch (error) {
				// the kv is unreachable, a read failure is not a lost claim
				console.warn(
					`[ownership] failed to read claim of channel [${channelId}], keeping it`,
					error,
				)

				return true
			}

			if (
				!entry ||
				entry.value.controller_id !== this.controller_id ||
				Number(entry.value.epoch ?? 0) !== epoch
			) {
				this.forget(channelId)
				return false
			}

			try {
				const revision = await this.bucket.update(
					key,
					this.payload(epoch),
					entry.revision,
				)

				this.revisions.set(channelId, revision)
				return true
			} catch {
				continue
			}
		}

		// the entry kept changing under us, assume it is still ours and
		// resynchronize on the next tick
		return true
	}

	/** renews every claim, returns the channels that were lost */
	async renewAll(channelIds: Iterable<string>): Promise<string[]> {
		const lost: string[] = []

		await Promise.all(
			Array.from(channelIds).map(async (id) => {
				if (!(await this.renew(id))) {
					lost.push(id)
				}
			}),
		)

		return lost
	}

	/** removes the claim when the channel closes, fenced by epoch */
	async release(channelId: string): Promise<void> {
		if (!this.bucket) return

		const epoch = this.epochs.get(channelId)

		this.forget(channelId)

		try {
			const entry = await this.bucket.getEntry<ChannelOwner>(
				this.key(channelId),
			)

			if (!entry) return
			if (entry.value.controller_id !== this.controller_id) return
			if (epoch !== undefined && Number(entry.value.epoch ?? 0) !== epoch) {
				return
			}

			await this.bucket.delete(this.key(channelId))
		} catch {
			return
		}
	}
}

export default ChannelOwnership
