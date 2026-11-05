import type {
	SfuAliveResult,
	SfuCanConsumePayload,
	SfuCanConsumeResult,
	SfuCloseConsumerPayload,
	SfuCloseProducerPayload,
	SfuCloseRouterPayload,
	SfuCloseTransportPayload,
	SfuConnectTransportPayload,
	SfuConsumePayload,
	SfuConsumerControlPayload,
	SfuConsumerDump,
	SfuConsumerResult,
	SfuCreateRouterPayload,
	SfuCreateTransportPayload,
	SfuGetRouterPayload,
	SfuListRoutersPayload,
	SfuListRoutersResult,
	SfuProducePayload,
	SfuProducerResult,
	SfuRequestKeyframePayload,
	SfuRouterDump,
	SfuSuccessResult,
	SfuTransportDump,
} from "./dto"

/**
 * Single source of truth for the sfu.<refName>.<event> routes.
 * Both the sfu node and the control plane consume this map.
 */
export interface SfuRoutesContract {
	alive: { payload: undefined; result: SfuAliveResult }
	createRouter: { payload: SfuCreateRouterPayload; result: SfuRouterDump }
	getRouter: { payload: SfuGetRouterPayload; result: SfuRouterDump | null }
	listRouters: {
		payload: SfuListRoutersPayload
		result: SfuListRoutersResult
	}
	closeRouter: { payload: SfuCloseRouterPayload; result: SfuSuccessResult }
	createRouterWebRtcTransport: {
		payload: SfuCreateTransportPayload
		result: SfuTransportDump
	}
	routerCanConsume: {
		payload: SfuCanConsumePayload
		result: SfuCanConsumeResult
	}
	connectTransport: {
		payload: SfuConnectTransportPayload
		result: SfuSuccessResult
	}
	produce: { payload: SfuProducePayload; result: SfuProducerResult }
	consume: { payload: SfuConsumePayload; result: SfuConsumerResult }
	closeTransport: {
		payload: SfuCloseTransportPayload
		result: SfuSuccessResult
	}
	closeProducer: {
		payload: SfuCloseProducerPayload
		result: SfuSuccessResult
	}
	closeConsumer: {
		payload: SfuCloseConsumerPayload
		result: SfuSuccessResult
	}
	consumerControl: {
		payload: SfuConsumerControlPayload
		result: SfuConsumerDump
	}
	requestKeyframe: {
		payload: SfuRequestKeyframePayload
		result: SfuSuccessResult
	}
}

export type SfuRouteName = keyof SfuRoutesContract

export type SfuRoutePayload<K extends SfuRouteName> =
	SfuRoutesContract[K]["payload"]

export type SfuRouteResult<K extends SfuRouteName> =
	SfuRoutesContract[K]["result"]

export type SfuRouteEnvelope<K extends SfuRouteName = SfuRouteName> = {
	event: K
	data: SfuRoutePayload<K>
}
