import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuProducePayload,
	SfuProducerResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const produceRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuProducePayload>,
		SfuProducerResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("transport", "transport_id")],
		fn: (data) => data.session.produce(data.transport_id, data),
	})
