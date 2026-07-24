import type { SFU_Node } from ".."
import type { IPCMsg } from "../ipc"
import type { IPC_ConnectTransportPayload } from "@comty/shared/types/rtc"

export default async function (
	this: SFU_Node,
	data: IPC_ConnectTransportPayload,
	msg: IPCMsg,
) {
	const transport = this.transports.get(data.transport_id)
	if (!transport) return

	await transport.connect({ dtlsParameters: data.dtlsParameters })

	msg.respond({ success: true })
}
