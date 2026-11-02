import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuRequestKeyframePayload,
	SfuSuccessResult,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"
import {
	requireRouter,
	type WithRouterSession,
} from "../middlewares/requireRouter"

export const requestKeyframeRoute = (path: string) =>
	defineNatsRoute<
		SfuNode,
		WithRouterSession<SfuRequestKeyframePayload>,
		SfuSuccessResult
	>({
		path,
		useContexts: ["routers"],
		useMiddlewares: [requireRouter("consumer", "consumer_id")],
		fn: (data) => data.session.requestKeyframe(data.consumer_id),
	})
