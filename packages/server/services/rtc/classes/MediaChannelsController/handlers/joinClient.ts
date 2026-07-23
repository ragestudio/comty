import GroupChannelsModel from "@db/group_channels"

import type MediaChannelsController from "../index"
import { RTCClient } from "@services/rtc/types"
import setFind from "@shared-utils/setFind"

export default async function (
	this: MediaChannelsController,
	client: RTCClient,
	group_id: string,
	channelId: string,
) {
	try {
		const channel = await GroupChannelsModel.findOne(
			{
				group_id: group_id,
				_id: channelId,
			},
			{
				raw: true,
			},
		)

		if (!channel) {
			throw new Error("Channel not found")
		}

		// Validate channel access
		const group = await this.validateGroupAccess(
			client.userId,
			channel.group_id,
		)

		// cancel any pending disconnect timeout
		this.cancelPendingDisconnect(client.userId)

		// check cache for existing membership
		const joinedChannel = await this.users.get(client.userId)

		// // if the user is already in the channel, skip
		// if (joinedChannel === channelId) {
		// 	return null
		// }

		// check if this is a reconnection (user already in a channel)
		if (joinedChannel) {
			// if joining a different channel, leave the old one first
			if (joinedChannel !== channelId) {
				await this.leaveClient(client)
			} else {
				// check if reconnection is possible
				const channelInstance = await this.getInstance(
					channelId,
					client,
				)

				if (channelInstance && !channelInstance.closed) {
					// replace old client reference
					const oldClient = setFind(
						channelInstance.clients,
						(c: RTCClient) => c.userId === client.userId,
					)

					if (oldClient) {
						this.cleanupOrphanedResources(oldClient)
						channelInstance.clients.delete(oldClient)
					}

					// update cache
					await this.users.set(client.userId, channelId)

					console.log(
						`[media-channels] User ${client.userId} reconnected to channel ${channelId}`,
					)

					return await channelInstance.joinClient(client, {
						isReconnection: true,
					})
				}

				console.log(
					`[media-channels] User ${client.userId} rejoining after channel was closed`,
				)
			}
		}

		// get or create channel instance
		let channelInstance = await this.getInstance(channelId, client)

		if (!channelInstance || channelInstance?.closed === true) {
			channelInstance = await this.createChannelInstance(
				group._id,
				channelId,
			)
		}

		await this.users.set(client.userId, channelId)

		return await channelInstance.joinClient(client)
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
