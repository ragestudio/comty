import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuConnectTransportPayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const connectTransportRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuConnectTransportPayload>,
		SfuSuccessResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("transport", "transport_id")],
		fn: (data) =>
			data.session.connectTransport(data.transport_id, data.dtlsParameters),
	})
