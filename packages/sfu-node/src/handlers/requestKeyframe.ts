import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"
import type { IPC_RequestKeyframePayload } from "@comty/shared/types/rtc/events/index"

export default async function (
	this: SFU_Node,
	data: IPC_RequestKeyframePayload,
	msg: IPCMsg,
) {
	const consumer = this.consumers.get(data.consumer_id)

	if (!consumer) {
		return msg.respond(null, "Consumer not found")
	}

	await consumer.requestKeyFrame()

	return msg.respond({ success: true })
}
