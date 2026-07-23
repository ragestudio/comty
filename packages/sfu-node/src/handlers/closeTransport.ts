import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"
import type { IPC_CloseTransportPayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_CloseTransportPayload,
	msg: MsgImpl,
) {
	const transport = this.transports.get(data.transport_id)
	if (!transport) return

	transport.close()
	this.transports.delete(data.transport_id)

	msg.respond(JSON.stringify({ success: true }))
}
