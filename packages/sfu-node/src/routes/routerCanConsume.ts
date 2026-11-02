import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCanConsumePayload,
	SfuCanConsumeResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const routerCanConsumeRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuCanConsumePayload, SfuCanConsumeResult>({
		path,
		useContexts: ["routers"],
		fn: (data, ctx) => ({
			canConsume: ctx.routers
				.get(data.router_id)
				.canConsume(data.producerId, data.rtpCapabilities),
		}),
	})
