import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"
import type { IPC_RequestKeyFramePayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_RequestKeyFramePayload,
	msg: IPCMsg,
) {
	const producer = this.producers.get(data.producer_id)
	if (!producer) return

	//await producer.requestKeyFrame()

	msg.respond({ success: true })
}
