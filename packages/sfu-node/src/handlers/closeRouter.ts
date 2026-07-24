import type { SFU_Node } from ".."
import type { IPC_CloseRouterPayload } from "@comty/shared/types/rtc"
import type { IPCMsg } from "../ipc"

export default async function (
	this: SFU_Node,
	data: IPC_CloseRouterPayload,
	msg: IPCMsg,
) {
	console.log("Closing router by ID:", data.id)
	if (!data.id) return

	const router = this.routers.get(data.id)
	if (!router) return

	router.close()
	this.routers.delete(data.id)

	console.log("Router closed:", router.id)
}
