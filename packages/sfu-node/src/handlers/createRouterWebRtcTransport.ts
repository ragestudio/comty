import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_CreateRouterRTCTransportPayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_CreateRouterRTCTransportPayload,
	msg: MsgImpl,
) {
	console.log("Creating router RTC transport:", data)

	const router = this.routers.get(data.router_id)
	if (!router) return

	// @ts-ignore
	const transport = await router.createWebRtcTransport({
		webRtcServer: this.rtc_server,
		enableUdp: true,
		enableTcp: true,
		preferUdp: true,
		listenIps: [
			{
				ip: "0.0.0.0",
				announcedIp: this.announced_ip,
			},
		],
	})

	this.transports.set(transport.id, transport)
	this.setupTransportEvents(transport)

	msg.respond(JSON.stringify(await transport.dump()))
}
