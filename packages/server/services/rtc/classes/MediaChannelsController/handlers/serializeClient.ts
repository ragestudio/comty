import type { RTCClient } from "@services/rtc/types"

export type SerializedRTCClient = {
	socket_id?: string
	node_id?: string
	token?: string
	user_id?: string
	username?: string
	user?: any
}

/**
 * Reduces a client to the fields needed to rebuild it on another node.
 * A client without a socket (eg. a grace period cleanup) keeps only the user.
 */
export default function serializeClient(
	client?: RTCClient | Partial<RTCClient> | null,
): SerializedRTCClient | null {
	if (!client) return null

	const context: any = (client as any).context ?? {}

	return {
		socket_id: context.socket_id ?? context.id ?? (client as any).id,
		node_id: context.node_id,
		token: context.token,
		user_id: context.user_id ?? (client as any).userId,
		username: context.username,
		user: context.user,
	}
}
