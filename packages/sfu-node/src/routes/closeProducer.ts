import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCloseProducerPayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const closeProducerRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuCloseProducerPayload>,
		SfuSuccessResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("producer", "producer_id")],
		fn: (data) => data.session.closeProducer(data.producer_id),
	})
