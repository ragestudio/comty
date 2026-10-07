import type { Channels } from "@comty/shared/types/spaces/channel"

import { cacheChannels } from "../../../../helpers/cache"

export function persistChannelsCache(
	groupId: string | null,
	channels: Channels,
) {
	if (!groupId) return

	cacheChannels(groupId, channels).catch((err) => {
		console.error("Failed to persist channels cache", err)
	})
}
