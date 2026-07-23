import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_CloseProducerPayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_CloseProducerPayload,
	msg: MsgImpl,
) {
	const producer = this.producers.get(data.producer_id)
	if (!producer) return

	producer.close()
	this.producers.delete(data.producer_id)

	msg.respond(JSON.stringify({ success: true }))
}
