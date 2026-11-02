import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuGetRouterPayload,
	SfuRouterDump,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const getRouterRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuGetRouterPayload, SfuRouterDump>({
		path,
		useContexts: ["routers"],
		fn: (data, ctx) => ctx.routers.get(data.router_id).dump(),
	})
