/**
 * Legacy IPC aliases. The canonical contract lives in types/sfu.
 */
export type {
	SfuCloseConsumerPayload as IPC_CloseConsumerPayload,
	SfuCloseProducerPayload as IPC_CloseProducerPayload,
	SfuCloseRouterPayload as IPC_CloseRouterPayload,
	SfuCloseTransportPayload as IPC_CloseTransportPayload,
	SfuConnectTransportPayload as IPC_ConnectTransportPayload,
	SfuConsumePayload as IPC_ConsumePayload,
	SfuConsumerControlPayload as IPC_ConsumerControlPayload,
	SfuCreateRouterPayload as IPC_CreateRouterPayload,
	SfuCreateTransportPayload as IPC_CreateRouterRTCTransportPayload,
	SfuGetRouterPayload as IPC_GetRouterPayload,
	SfuListRoutersPayload as IPC_ListRoutersPayload,
	SfuNodeRegisterPayload as IPC_RegisterNodePayload,
	SfuNodeUnregisterPayload as IPC_UnregisterNodePayload,
	SfuProducePayload as IPC_ProducePayload,
	SfuRequestKeyframePayload as IPC_RequestKeyframePayload,
	SfuCanConsumePayload as IPC_RouterCanConsumePayload,
} from "../../sfu/index"
