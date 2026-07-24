import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"

export default async function (this: SFU_Node, data: any, msg: IPCMsg) {
	const router_id = data.router_id
	if (!router_id) {
		msg.respond(null, "Missing router_id")
		return
	}

	const router = this.routers.get(router_id)
	if (!router) {
		msg.respond(null, "Router not found")
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
