import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCloseTransportPayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const closeTransportRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuCloseTransportPayload>,
		SfuSuccessResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("transport", "transport_id")],
		fn: (data) => data.session.closeTransport(data.transport_id),
	})
