import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"

export default async function (this: SFU_Node, data: any, msg: MsgImpl) {
	const router_id = data.router_id
	if (!router_id) {
		msg.respond(JSON.stringify(null))
		return
	}

	const router = this.routers.get(router_id)
	if (!router) {
		msg.respond(JSON.stringify(null))
		return
	}

	const dump = await router.dump()

	msg.respond(
		JSON.stringify({
			...dump,
			rtpCapabilities: router.rtpCapabilities,
		}),
	)
}
