import type { RouteObject } from "linebridge/classes/Route/index"
import type { SfuRouteName } from "@comty/shared/types/sfu/index"

import type { SfuConfig } from "../config"
import type { SfuNode } from "../index"

import { aliveRoute } from "./alive"
import { closeConsumerRoute } from "./closeConsumer"
import { closeProducerRoute } from "./closeProducer"
import { closeRouterRoute } from "./closeRouter"
import { closeTransportRoute } from "./closeTransport"
import { connectTransportRoute } from "./connectTransport"
import { consumeRoute } from "./consume"
import { consumerControlRoute } from "./consumerControl"
import { createRouterRoute } from "./createRouter"
import { createRouterWebRtcTransportRoute } from "./createRouterWebRtcTransport"
import { getRouterRoute } from "./getRouter"
import { listRoutersRoute } from "./listRouters"
import { produceRoute } from "./produce"
import { requestKeyframeRoute } from "./requestKeyframe"
import { routerCanConsumeRoute } from "./routerCanConsume"

export type SfuRoutes = Record<
	SfuRouteName,
	RouteObject<SfuNode, any, "generic", any>
>

export function buildRoutes(config: SfuConfig): SfuRoutes {
	const subject = (event: string) => `sfu.${config.refName}.${event}`

	return {
		alive: aliveRoute(subject("alive")),
		createRouter: createRouterRoute(subject("createRouter")),
		getRouter: getRouterRoute(subject("getRouter")),
		listRouters: listRoutersRoute(subject("listRouters")),
		closeRouter: closeRouterRoute(subject("closeRouter")),
		createRouterWebRtcTransport: createRouterWebRtcTransportRoute(
			subject("createRouterWebRtcTransport"),
		),
		routerCanConsume: routerCanConsumeRoute(subject("routerCanConsume")),
		connectTransport: connectTransportRoute(subject("connectTransport")),
		produce: produceRoute(subject("produce")),
		consume: consumeRoute(subject("consume")),
		closeTransport: closeTransportRoute(subject("closeTransport")),
		closeProducer: closeProducerRoute(subject("closeProducer")),
		closeConsumer: closeConsumerRoute(subject("closeConsumer")),
		consumerControl: consumerControlRoute(subject("consumerControl")),
		requestKeyframe: requestKeyframeRoute(subject("requestKeyframe")),
	}
}

export default buildRoutes
