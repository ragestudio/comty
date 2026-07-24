import type { SFU_Node } from ".."
import type { IPC_CloseConsumerPayload } from "@comty/shared/types/rtc"
import type { IPCMsg } from "../ipc"

export default async function (
	this: SFU_Node,
	data: IPC_CloseConsumerPayload,
	msg: IPCMsg,
) {
	const consumer = this.consumers.get(data.consumer_id)
	if (!consumer) return

	consumer.close()
	this.consumers.delete(data.consumer_id)

	msg.respond({ success: true })
}
