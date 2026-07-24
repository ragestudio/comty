import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"

export default async function (this: SFU_Node, data: any, msg: IPCMsg) {
	msg.respond(true)
}
