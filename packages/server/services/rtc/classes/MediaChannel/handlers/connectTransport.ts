import type { RTCClient } from "@services/rtc/types"
import type { RTC_ConnectTransportPayload } from "@comty/shared/types/rtc/events/index"

import setFind from "@shared-utils/setFind"

async function connectTransportHandler(
	this: any,
	client: RTCClient,
	payload: RTC_ConnectTransportPayload,
) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			throw new Error("Client not in channel")
		}

		const { transportId, dtlsParameters } = payload
		const transport = clientInst.transports?.get(transportId)

		if (!transport) {
			throw new Error("Transport not found")
		}

		await transport.connect({ dtlsParameters })

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error connecting transport for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default connectTransportHandler
