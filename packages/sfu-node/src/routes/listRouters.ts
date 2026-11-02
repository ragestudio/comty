import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuListRoutersPayload,
	SfuListRoutersResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const listRoutersRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuListRoutersPayload, SfuListRoutersResult>({
		path,
		useContexts: ["routers"],
		fn: (_data, ctx) => ctx.routers.list(),
	})
