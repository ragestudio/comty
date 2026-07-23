import setFind from "@shared-utils/setFind"
import type MediaChannel from ".."

import type { RTCClient } from "@services/rtc/types"

async function createTransportHandler(this: MediaChannel, client: RTCClient) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			return null
		}

		if (!clientInst.transports) {
			client.transports = new Map()
		}

		const transport = await this.router.createWebRtcTransport()

		clientInst.transports.set(transport.id, transport)

		this._setupTransportEvents(transport, clientInst)

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}

		return {
			id: transport.id,
			iceParameters: transport.iceParameters,
			iceCandidates: transport.iceCandidates,
			dtlsParameters: transport.dtlsParameters,
		}
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error creating WebRTC transport for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default createTransportHandler
