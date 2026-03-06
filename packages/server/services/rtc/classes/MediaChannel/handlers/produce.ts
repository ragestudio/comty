import Producer from "../producer"
import validateRtpParameters from "../utils/validateRtpParameters"
import setFind from "@shared-utils/setFind"
import type { RTCClient } from "../types.d.ts"

export type ProducePayload = {
	transportId: string
	kind: string
	rtpParameters: any
}

async function produceHandler(
	this: any,
	client: RTCClient,
	payload: ProducePayload,
) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			throw new Error("Client not in channel")
		}

		if (!payload) {
			throw new OperationError(400, "Payload not defined")
		}

		if (!payload.transportId || !payload.kind || !payload.rtpParameters) {
			throw new OperationError(400, "Missing required parameters")
		}

		const transport = clientInst.transports?.get(payload.transportId)

		if (!transport) {
			throw new OperationError(404, "Transport not found")
		}

		// Validate RTP parameters
		validateRtpParameters(payload.rtpParameters, payload.kind)

		// create producer
		const producer = new Producer({
			transport: transport,
			client: clientInst,
			channel: this.data,
			instance: this,
		})

		await producer.initialize(payload)

		return producer.serialize()
	} catch (error) {
		console.error(`Error producing for ${client.userId}:`, error)
		throw error
	}
}

export default produceHandler
