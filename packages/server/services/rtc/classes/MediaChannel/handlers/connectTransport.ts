import setFind from "@shared-utils/setFind"
import type { RTCClient } from "../types.d.ts"

export type ConnectTransportPayload = {
	transportId: string
	dtlsParameters: any
}

async function connectTransportHandler(
	this: any,
	client: RTCClient,
	payload: ConnectTransportPayload,
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
	} catch (error) {
		console.error(`Error connecting transport for ${client.userId}:`, error)
		throw error
	}
}

export default connectTransportHandler
