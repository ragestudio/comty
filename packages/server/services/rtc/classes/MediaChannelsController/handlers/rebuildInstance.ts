import type { RTCClient } from "@services/rtc/types"
import type MediaChannelsController from ".."

import { getClientUser } from "@shared-utils/clientUser"
import createRemoteClient from "./remoteClient"

type RosterEntry = {
	userId: string
	user: any
	voiceState: any
}

/**
 * Recreates the media session of a local channel on a healthy sfu node.
 *
 * The previous router is gone, so every client must negotiate its transports
 * again. The roster is preserved: their next operation binds the live client
 * to the new instance, which keeps the channel visible without a full reload.
 */
export default async function (
	this: MediaChannelsController,
	channelId: string,
): Promise<boolean> {
	return await this.withInstanceLock(channelId, async () => {
		const current = this.instances.get(channelId)

		if (!current || current.closed) {
			return false
		}

		const groupId = current.data?.group_id

		const roster: RosterEntry[] = Array.from(current.clients).map((client) => ({
			userId: client.userId,
			user: getClientUser(client) ?? { _id: client.userId },
			voiceState: client.voiceState,
		}))

		console.warn(
			`[media-channels] rebuilding media session of channel [${channelId}]`,
		)

		// the sfu session is gone, drop the local instance and its state
		await current.detach().catch(() => null)

		await this.mediaChannelsStateBucket.delete(channelId)

		if (!groupId) {
			return false
		}

		const rebuilt = await this.createChannelInstance(groupId, channelId)

		for (const entry of roster) {
			rebuilt.clients.add(
				createRemoteClient({
					userId: entry.userId,
					channelId: channelId,
					user: entry.user,
					voiceState: entry.voiceState,
				}),
			)
		}

		rebuilt.lastActivityAt = Date.now()

		console.log(
			`[media-channels] channel [${channelId}] media session rebuilt with ${roster.length} clients`,
		)

		return true
	})
}
