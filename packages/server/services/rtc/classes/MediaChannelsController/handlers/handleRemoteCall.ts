import type { Msg } from "@nats-io/transport-node"
import type MediaChannelsController from ".."
import type { RTCClient } from "@services/rtc/types"
import type { SerializedRTCClient } from "./serializeClient"

import synthesizeClient from "linebridge/classes/Nats/synthesizeClient"

function respond(
	msg: Msg,
	ok: boolean,
	data?: any,
	error?: string,
	code?: number,
) {
	msg.respond(Buffer.from(JSON.stringify({ ok, data, error, code })))
}

/**
 * Rebuilds the client that issued the operation. Emits from this client are
 * routed back to the socket through its original gateway headers.
 */
async function rebuildClient(
	this: MediaChannelsController,
	serialized: SerializedRTCClient | null,
	channelId?: string,
): Promise<RTCClient | null> {
	if (!serialized) {
		return null
	}

	// a cleanup without a socket only needs the user id
	if (!serialized.socket_id) {
		return { userId: serialized.user_id } as RTCClient
	}

	const adapter = this.server.nats

	if (!adapter) {
		throw new OperationError(503, "Cluster routing is not available")
	}

	const client = await synthesizeClient(
		{
			socket_id: serialized.socket_id,
			node_id: serialized.node_id,
			token: serialized.token,
			user: serialized.user,
			session: serialized.user_id
				? {
						user_id: serialized.user_id,
						username: serialized.username ?? "",
					}
				: undefined,
		},
		adapter as any,
	)

	;(client as any).channel_id = channelId

	return client as unknown as RTCClient
}

/**
 * Handles an operation forwarded by another node. Only the channel owner
 * receives these calls, so the local instance is the source of truth.
 */
export default async function (
	this: MediaChannelsController,
	msg: Msg,
): Promise<void> {
	let payload: any

	try {
		payload = JSON.parse(Buffer.from(msg.data).toString())
	} catch {
		return respond(msg, false, null, "Invalid payload", 400)
	}

	if (!payload?.method) {
		return respond(msg, false, null, "Missing method", 400)
	}

	try {
		const client = await rebuildClient.call(
			this,
			payload.client,
			payload.channel_id,
		)

		// keyframes are requested directly to the shared sfu node
		if (payload.method === "requestKeyframe") {
			const instance = await this.getInstance(payload.channel_id)

			if (!instance || (instance as any).is_remote) {
				throw new OperationError(
					409,
					"Channel is not owned by this node",
				)
			}

			const data = await (instance as any).sfu_node.requestKeyframe(
				payload.args?.[0],
			)

			return respond(msg, true, data)
		}

		// user based cleanup has no client attached
		if (payload.method === "leaveUser") {
			const data = await this.leaveUser(payload.args?.[0])

			return respond(msg, true, data)
		}

		if (payload.target === "controller") {
			const fn = (this as any)[payload.method]

			if (typeof fn !== "function") {
				throw new OperationError(
					400,
					`Unknown method ${payload.method}`,
				)
			}

			const data = await fn(client, ...(payload.args ?? []))

			return respond(msg, true, data)
		}

		const instance = await this.getInstance(payload.channel_id, client)

		if (!instance) {
			throw new OperationError(404, "Channel not found")
		}

		if ((instance as any).is_remote) {
			throw new OperationError(409, "Channel moved to another node")
		}

		const fn = (instance as any)[payload.method]

		if (typeof fn !== "function") {
			throw new OperationError(400, `Unknown method ${payload.method}`)
		}

		const data = await fn(client, ...(payload.args ?? []))

		return respond(msg, true, data)
	} catch (error: any) {
		respond(
			msg,
			false,
			null,
			error?.message ?? String(error),
			error?.code ?? 500,
		)
	}
}
