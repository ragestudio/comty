import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"
import type { IPC_RouterCanConsumePayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_RouterCanConsumePayload,
	msg: IPCMsg,
) {
	const router = this.routers.get(data.router_id)
	if (!router) return

	const canConsume = router.canConsume({
		producerId: data.producerId,
		rtpCapabilities: data.rtpCapabilities,
	})

	msg.respond({ canConsume })
}
