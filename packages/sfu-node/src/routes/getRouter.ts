import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuGetRouterPayload,
	SfuRouterDump,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

/**
 * Returns null when the router does not exist. The control plane uses it to
 * validate a persisted session before adopting it, so a missing router is an
 * answer, not an error.
 */
export const getRouterRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuGetRouterPayload, SfuRouterDump | null>({
		path,
		useContexts: ["routers"],
		fn: async (data, ctx) => {
			const session = ctx.routers.findById(data.router_id)

			if (!session) return null

			return {
				...(await session.dump()),
				channelId: session.appData.channelId,
			}
		},
	})
