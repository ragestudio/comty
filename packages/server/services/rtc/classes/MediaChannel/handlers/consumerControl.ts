import type { MediaChannel } from ".."
import type { RTCClient } from "@services/rtc/types"
import type { IPC_ConsumerControlPayload } from "@comty/shared/types/rtc/events/index"

import setFind from "@shared-utils/setFind"

export default async function (
	this: MediaChannel,
	client: RTCClient,
	payload: IPC_ConsumerControlPayload,
) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			throw new Error("Client not in channel")
		}

		return await this.sfu_node.consumerControl(payload)
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error controling consumer for ${client.userId}:`,
			error,
		)
		throw error
	}
}
