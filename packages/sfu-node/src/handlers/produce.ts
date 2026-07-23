import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_ProducePayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_ProducePayload,
	msg: MsgImpl,
) {
	const transport = this.transports.get(data.transport_id)
	if (!transport) return

	const producer = await transport.produce({
		kind: data.kind,
		rtpParameters: data.rtpParameters,
		appData: data.appData,
	})

	this.producers.set(producer.id, producer)

	this.setupProducerEvents(producer)

	msg.respond(
		JSON.stringify({
			id: producer.id,
			kind: producer.kind,
			rtpParameters: producer.rtpParameters,
			appData: producer.appData,
		}),
	)
}
