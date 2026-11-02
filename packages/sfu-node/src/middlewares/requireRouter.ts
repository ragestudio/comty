import type { NatsRequest } from "@linebridge/engine-nats"
import type {
	GenericMiddlewareObj,
	GenericResponse,
} from "linebridge/classes/Handler/index"
import type { RouterRegistry } from "../media/RouterRegistry"
import type { RouterSession } from "../media/RouterSession"

export type RouterLookup = "router" | "transport" | "producer" | "consumer"

export type RouterIdKey =
	| "router_id"
	| "transport_id"
	| "producer_id"
	| "consumer_id"

export interface RouterPayload {
	router_id?: string
	transport_id?: string
	producer_id?: string
	consumer_id?: string
}

export type WithRouterSession<T> = T & {
	session: RouterSession
}

type MiddlewareCtx = {
	routers: RouterRegistry
}

function findSession(
	routers: RouterRegistry,
	kind: RouterLookup,
	id: string,
): RouterSession | undefined {
	switch (kind) {
		case "router":
			return routers.findById(id)
		case "transport":
			return routers.findByTransport(id)
		case "producer":
			return routers.findByProducer(id)
		case "consumer":
			return routers.findByConsumer(id)
	}
}

/**
 * Resolves the router session that owns the entity referenced in the payload
 * and injects it as `session`. Responds with 400/404 when it cannot resolve.
 */
export function requireRouter(
	kind: RouterLookup,
	idKey: RouterIdKey,
): GenericMiddlewareObj<NatsRequest<RouterPayload>, GenericResponse> {
	return {
		useContexts: ["routers"],
		fn: (req, res, next, ctx: MiddlewareCtx & Record<string, any>) => {
			const id = req.data?.[idKey]

			if (!id) {
				return res.error(
					new OperationError(400, `missing ${idKey}`),
					400,
				)
			}

			const session = findSession(ctx.routers, kind, id)

			if (!session) {
				return res.error(
					new OperationError(404, `${kind} [${id}] not found`),
					404,
				)
			}

			;(req.data as RouterPayload & { session: RouterSession }).session =
				session

			next()
		},
	}
}

export default requireRouter
