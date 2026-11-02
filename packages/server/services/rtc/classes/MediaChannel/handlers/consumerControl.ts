import type { MediaChannel } from ".."
import type { RTCClient } from "@services/rtc/types"
import type { SfuConsumerControlPayload } from "@comty/shared/types/sfu/index"

import setFind from "@shared-utils/setFind"

export default async function (
	this: MediaChannel,
	client: RTCClient,
	payload: SfuConsumerControlPayload,
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
