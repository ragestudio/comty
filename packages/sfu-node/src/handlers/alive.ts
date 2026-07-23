import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"

export default async function (this: SFU_Node, data: any, msg: MsgImpl) {
	msg.respond("true")
}
