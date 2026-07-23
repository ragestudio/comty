import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_CloseConsumerPayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_CloseConsumerPayload,
	msg: MsgImpl,
) {
	const consumer = this.consumers.get(data.consumer_id)
	if (!consumer) return

	consumer.close()
	this.consumers.delete(data.consumer_id)

	msg.respond(JSON.stringify({ success: true }))
}
