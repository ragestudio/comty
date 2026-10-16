import type { Channels } from "@comty/shared/types/spaces/channel"

import { cacheChannels } from "../../../../helpers/cache"
import logger from "@/utils/logger"

export function persistChannelsCache(
	groupId: string | null,
	channels: Channels,
) {
	if (!groupId) return

	cacheChannels(groupId, channels).catch((err) => {
		logger.error("Failed to persist channels cache", err)
	})
}
