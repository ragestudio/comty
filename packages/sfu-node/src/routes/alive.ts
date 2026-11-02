import { defineNatsRoute } from "@linebridge/engine-nats"

import type { SfuAliveResult } from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const aliveRoute = (path: string) =>
	defineNatsRoute<SfuNode, undefined, SfuAliveResult>({
		path,
		useContexts: ["worker"],
		fn: (_data, ctx) => ctx.worker.alive,
	})
