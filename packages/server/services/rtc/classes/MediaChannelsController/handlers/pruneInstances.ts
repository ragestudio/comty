import type MediaChannelsController from ".."
import type { SerializedMediaChannel } from "@classes/MediaChannel"

import discardState from "./discardState"

// a channel without live clients is closed after this time. it covers
// restored or rebuilt sessions nobody came back to
const IDLE_CHANNEL_TTL_MS = 60_000
// the orphaned state scan walks the whole bucket, it runs less often
const ORPHAN_SCAN_EVERY = 10

// a session is only considered orphaned after this time without an owner,
// it covers a node restarting and restoring its channels
const ORPHAN_MIN_AGE_MS = 5 * 60_000

let ticks = 0

/**
 * Reaps idle local instances and sessions whose owner is gone. This keeps the
 * cluster free of routers and state entries that no node is serving anymore.
 */
export default async function (this: MediaChannelsController) {
	const now = Date.now()

	for (const [channelId, instance] of [...this.instances]) {
		if (instance.closed) {
			this.instances.delete(channelId)
			continue
		}

		// a restored session keeps its clients as placeholders while they are
		// still connected, only an empty channel is safe to reap
		if (instance.clients.size > 0) continue
		if (now - instance.lastActivityAt < IDLE_CHANNEL_TTL_MS) continue

		console.log(`[media-channels] closing empty channel [${channelId}]`)

		await instance
			.close()
			.catch((error) =>
				console.error(
					`[media-channels] failed to close empty channel [${channelId}]`,
					error,
				),
			)
	}

	ticks++

	if (ticks % ORPHAN_SCAN_EVERY !== 0) return

	await pruneOrphanedStates.call(this)
}

/** drops persisted sessions whose owner stopped renewing */
async function pruneOrphanedStates(this: MediaChannelsController) {
	const bucket = this.mediaChannelsStateBucket

	if (!bucket) return

	const now = Date.now()

	let keys: AsyncIterable<string>

	try {
		keys = await bucket.keys()
	} catch {
		return
	}

	for await (const channelId of keys) {
		if (this.instances.has(channelId)) continue

		try {
			const state = await bucket.get<SerializedMediaChannel>(channelId)

			if (!state) continue

			// the channel is still served by a live owner
			const owner = await this.ownership.resolve(channelId)

			if (owner) {
				if (state.closed) {
					await bucket.delete(channelId)
				}

				continue
			}

			// a node may be restoring it right now, wait before dropping it
			if (now - Number(state.flushed_at ?? 0) < ORPHAN_MIN_AGE_MS) {
				continue
			}

			console.warn(
				`[media-channels] removing orphaned session of channel [${channelId}]`,
			)

			// only close the router when nobody is expected to be consuming it,
			// a session with clients may still be alive on a paused node
			await discardState.call(this, channelId, state, {
				closeRouter: !(state.clients?.length ?? 0),
			})
		} catch (error) {
			console.error(
				`[media-channels] failed to prune channel [${channelId}]`,
				error,
			)
		}
	}
}
