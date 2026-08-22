import type { SetGroupState, GetGroupState } from "./context"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"
import type { Message } from "@comty/shared/types/spaces/message"

import db from "../../../store"
import { cacheChannels } from "../../../helpers/cache"

/**
 * persists the full Channels object to Dexie after a state update.
 * The `channels` table stores one document per group (keyed by group_id),
 * not individual Channel rows.
 */
function persistChannelsCache(groupId: string | null, channels: Channels) {
	if (!groupId) return
	cacheChannels(groupId, channels).catch((err) => {
		console.error("Failed to persist channels cache", err)
	})
}

export const createChannelEvents = (
	set: SetGroupState,
	get: GetGroupState,
) => ({
	handleChannelCreated: (payload: Channel) => {
		set((state) => {
			const updatedChannels: Channels = {
				...state.channels,
				total_items: (state.channels?.total_items ?? 0) + 1,
				items: [...(state.channels?.items ?? []), payload],
			}

			persistChannelsCache(state.groupId, updatedChannels)

			return { channels: updatedChannels }
		})
	},

	handleChannelDeleted: (payload: Channel) => {
		set((state) => {
			const updatedChannels: Channels = {
				...state.channels,
				total_items: Math.max(
					(state.channels?.total_items ?? 1) - 1,
					0,
				),
				items: (state.channels?.items ?? []).filter(
					(c) => c._id !== payload._id,
				),
			}

			persistChannelsCache(state.groupId, updatedChannels)

			// also clean up orphaned messages for the deleted channel
			db.channel_messages
				.where("channel_id")
				.equals(payload._id)
				.delete()
				.catch((err) => {
					console.error("Failed to delete channel messages", err)
				})

			return { channels: updatedChannels }
		})
	},

	handleChannelUpdated: (payload: Channel) => {
		set((state) => {
			const updatedChannels: Channels = {
				...state.channels,
				items: (state.channels?.items ?? []).map((c) =>
					c._id === payload._id ? { ...c, ...payload } : c,
				),
			}

			persistChannelsCache(state.groupId, updatedChannels)

			return { channels: updatedChannels }
		})
	},

	handleChannelsOrdered: (payload: string[]) => {
		set((state) => {
			const channelMap = new Map(
				(state.channels?.items ?? []).map((c) => [c._id, c]),
			)

			const orderedItems = payload
				.map((id) => channelMap.get(id))
				.filter(Boolean) as Channel[]

			const unorderedItems = (state.channels?.items ?? []).filter(
				(c) => !payload.includes(c._id),
			)

			const updatedChannels: Channels = {
				...state.channels,
				items: [...orderedItems, ...unorderedItems],
			}

			persistChannelsCache(state.groupId, updatedChannels)

			return { channels: updatedChannels }
		})
	},

	handleChannelNewMessage: (payload: Message) => {
		set((state) => {
			const updatedChannels: Channels = {
				...state.channels,
				items: (state.channels?.items ?? []).map((c) => {
					if (c._id === payload.channel_id) {
						return {
							...c,
							last_message: payload,
						}
					}
					return c
				}),
			}

			persistChannelsCache(state.groupId, updatedChannels)

			return { channels: updatedChannels }
		})
	},
})
