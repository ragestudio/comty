import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_ConsumePayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_ConsumePayload,
	msg: MsgImpl,
) {
	const transport = this.transports.get(data.transport_id)
	if (!transport) return

	const consumer = await transport.consume({
		producerId: data.producerId,
		rtpCapabilities: data.rtpCapabilities,
		paused: data.paused ?? false,
	})

	this.consumers.set(consumer.id, consumer)

	this.setupConsumerEvents(consumer)

	msg.respond(
		JSON.stringify({
			id: consumer.id,
			producerId: consumer.producerId,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
		}),
	)
}
