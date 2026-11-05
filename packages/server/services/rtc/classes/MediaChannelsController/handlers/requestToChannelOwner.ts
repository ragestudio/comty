import type MediaChannelsController from ".."
import type { SerializedRTCClient } from "./serializeClient"

export type RemoteCallPayload = {
	target: "controller" | "channel"
	channel_id?: string
	method: string
	args?: any[]
	client?: SerializedRTCClient | null
}

/**
 * Forwards a channel operation to the node that owns the channel and returns
 * its result. Errors raised on the owner are rethrown with their status.
 */
export default async function (
	this: MediaChannelsController,
	nodeId: string,
	payload: RemoteCallPayload,
): Promise<any> {
	const nats = this.server.nats?.connection

	if (!nats) {
		throw new OperationError(503, "Cluster routing is not available")
	}

	const response = await nats.request(
		`rtc.channel.${nodeId}`,
		JSON.stringify(payload),
		{ timeout: 15000 },
	)

	let decoded: any

	try {
		decoded = JSON.parse(Buffer.from(response.data).toString())
	} catch {
		throw new OperationError(502, "Invalid response from channel owner")
	}

	if (!decoded?.ok) {
		throw new OperationError(
			decoded?.code ?? 500,
			decoded?.error ?? "Remote channel error",
		)
	}

	return decoded.data
}
