import Producer from "../producer"
import validateRtpParameters from "../utils/validateRtpParameters"
import setFind from "@shared-utils/setFind"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"

import type { RTCClient } from "@services/rtc/types"
import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

export type ProducePayload = {
	transportId: string
	kind: string
	rtpParameters: any
	appData?: any
}

const resolveProducerPermission = (
	payload: ProducePayload,
): GroupPermission => {
	const mediaTag = payload.appData?.mediaTag

	if (mediaTag === "user-mic") {
		return "VOICE_SPEAK"
	}

	if (mediaTag === "user-cam" || mediaTag === "screen-video") {
		return "VOICE_STREAM"
	}

	if (mediaTag === "screen-audio") {
		return "VOICE_STREAM"
	}

	return payload.kind === "audio" ? "VOICE_SPEAK" : "VOICE_STREAM"
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

		const groupId = this.data?.group_id

		if (typeof groupId === "string" && groupId.length > 0) {
			const permission = resolveProducerPermission(payload)
			const authz = await Gatekeeper.forGroup(groupId, client.userId)

			if (!authz.can(permission)) {
				throw new OperationError(
					403,
					"You are not allowed to publish this media",
				)
			}
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

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}

		return producer.serialize()
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error producing for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default produceHandler
