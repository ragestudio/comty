import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCreateRouterPayload,
	SfuRouterDump,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const createRouterRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuCreateRouterPayload, SfuRouterDump>({
		path,
		useContexts: ["routers"],
		fn: async (data, ctx) => (await ctx.routers.create(data)).dump(),
	})
