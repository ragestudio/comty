import type MediaChannelsController from "../index"
import type { SerializedMediaChannel } from "@classes/MediaChannel"
import type { StatedChannel } from "@comty/shared/types/rtc/statedChannel"

// the persisted state keeps producers grouped by user, the api exposes a
// flat list like the live instance does
function flattenProducers(state: SerializedMediaChannel) {
	const producers: any[] = []

	for (const [userId, userProducers] of Object.entries(
		state.producers ?? {},
	)) {
		for (const [id, producer] of Object.entries(userProducers ?? {})) {
			producers.push({
				id: (producer as any).id ?? id,
				producerId: (producer as any).producerId ?? id,
				channelId: (producer as any).channelId ?? state.channel_id,
				groupId: (producer as any).groupId ?? state.data?.group_id,
				userId: (producer as any).userId ?? userId,
				kind: (producer as any).kind ?? null,
				appData: (producer as any).appData ?? null,
			})
		}
	}

	return producers
}

function toStatedChannel(state: SerializedMediaChannel): StatedChannel {
	return {
		__v: state.data?.__v,
		_id: state.data?._id ?? state.channel_id,
		clients: state.clients ?? [],
		producers: flattenProducers(state),
		started_at: state.started_at,
	}
}

/**
 * Returns the active voice channels of a group.
 *
 * Local instances are authoritative, channels owned by other nodes are read
 * from the shared state bucket, otherwise each node would only see its own.
 */
export default async function (
	this: MediaChannelsController,
	groupId: string,
): Promise<StatedChannel[]> {
	const channels = new Map<string, StatedChannel>()

	for (const instance of this.instances.values()) {
		if (instance.closed) continue
		if (instance.data?.group_id !== groupId) continue

		channels.set(instance.channelId, instance.serialized_state())
	}

	if (this.mediaChannelsStateBucket) {
		try {
			const keys = await this.mediaChannelsStateBucket.keys()

			for await (const key of keys) {
				if (channels.has(key)) continue

				const state =
					await this.mediaChannelsStateBucket.get<SerializedMediaChannel>(
						key,
					)

				if (!state || state.closed) continue
				if (state.data?.group_id !== groupId) continue

				// a session written by this node is ours even when the instance
				// is not loaded yet (a restarted service). hiding it here makes
				// the clients drop the channel and ignore the first events
				if (state.ownership?.node_id === this.nodeId) {
					channels.set(key, toStatedChannel(state))
					continue
				}

				// a state entry left by a dead node must not be exposed as an
				// active channel
				const owner = await this.ownership.resolve(key)

				if (!owner) continue

				channels.set(key, toStatedChannel(state))
			}
		} catch (error) {
			console.error(
				`[media-channels] failed to load group channels [${groupId}]`,
				error,
			)
		}
	}

	return Array.from(channels.values())
}
