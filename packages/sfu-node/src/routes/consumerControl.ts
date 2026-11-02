import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuConsumerControlPayload,
	SfuConsumerDump,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const consumerControlRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuConsumerControlPayload>,
		SfuConsumerDump
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("consumer", "consumer_id")],
		fn: (data) => data.session.consumerControl(data.consumer_id, data.paused),
	})
