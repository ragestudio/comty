import { defineNatsRoute } from "@linebridge/engine-nats"

import type {
	SfuCreateTransportPayload,
	SfuTransportDump,
} from "@comty/shared/types/sfu/index"
import type { SfuNode } from "../index"

export const createRouterWebRtcTransportRoute = (path: string) =>
	defineNatsRoute<SfuNode, SfuCreateTransportPayload, SfuTransportDump>({
		path,
		useContexts: ["routers"],
		fn: (data, ctx) => ctx.routers.get(data.router_id).createTransport(),
	})
