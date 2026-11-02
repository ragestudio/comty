import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuConsumePayload,
	SfuConsumerResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const consumeRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuConsumePayload>,
		SfuConsumerResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("transport", "transport_id")],
		fn: (data) => data.session.consume(data.transport_id, data),
	})
