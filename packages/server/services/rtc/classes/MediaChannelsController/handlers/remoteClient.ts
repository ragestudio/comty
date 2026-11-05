import type { RTCClient } from "@services/rtc/types"

export type RemoteClientParams = {
	userId: string
	channelId: string
	user?: any
	voiceState?: any
}

/**
 * Client placeholder for a session that survived a service restart or a
 * channel rebuild. The socket reference is gone, so events are routed to the
 * user sessions through the cluster instead of a single connection.
 *
 * A user without sessions simply ignores them, which makes the placeholder
 * safe even when the client is gone already.
 */
export function createRemoteClient({
	userId,
	channelId,
	user,
	voiceState,
}: RemoteClientParams): RTCClient {
	const context = {
		user_id: userId,
		username: user?.username,
		user: user ?? { _id: userId },
	}

	return {
		staled: true,
		userId,
		channel_id: channelId,
		voiceState: voiceState ?? { muted: false, deafen: false },
		context,
		emit: async (event: string, payload: any) => {
			try {
				return await globalThis.websockets?.senders?.toUserId(
					userId,
					event,
					payload,
				)
			} catch (error) {
				console.error(
					`[media-channels] failed to emit [${event}] to user [${userId}]`,
					error,
				)
			}
		},
	} as unknown as RTCClient
}

export default createRemoteClient
