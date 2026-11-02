import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCloseConsumerPayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const closeConsumerRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuCloseConsumerPayload>,
		SfuSuccessResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("consumer", "consumer_id")],
		fn: (data) => data.session.closeConsumer(data.consumer_id),
	})
