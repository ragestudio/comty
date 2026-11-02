import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCloseRouterPayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const closeRouterRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuCloseRouterPayload, SfuSuccessResult>({
		path,
		useContexts: ["routers"],
		fn: async (data, ctx) => ({
			success: await ctx.routers.close(data.id),
		}),
	})
