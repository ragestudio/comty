import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"
import type { IPC_ConsumerControlPayload } from "@comty/shared/types/rtc/events/index"

export default async function (
	this: SFU_Node,
	data: IPC_ConsumerControlPayload,
	msg: IPCMsg,
) {
	const consumer = this.consumers.get(data.consumer_id)

	if (!consumer) {
		return msg.respond(null, "Consumer not found")
	}

	if (typeof data.paused === "undefined") {
		return msg.respond(null, "Invalid payload")
	}

	if (data.paused === true) {
		console.log(`Pausing consumer [${data.consumer_id}]`)
		await consumer.pause()
	}

	if (data.paused === false) {
		console.log(`Resuming consumer [${data.consumer_id}]`)
		await consumer.resume()
		await consumer.requestKeyFrame()
	}

	return msg.respond(await consumer.dump())
}
