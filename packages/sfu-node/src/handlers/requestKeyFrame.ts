import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_RequestKeyFramePayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_RequestKeyFramePayload,
	msg: MsgImpl,
) {
	const producer = this.producers.get(data.producer_id)
	if (!producer) return

	//await producer.requestKeyFrame()

	msg.respond(JSON.stringify({ success: true }))
}
