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

		const currentUserMediaChannel = this.usersMap.get(client.userId)

		// check if this is a reconnection (user was already mapped to a channel)
		if (currentUserMediaChannel) {
			// if joining a different channel, leave the old one first
			if (currentUserMediaChannel !== channelId) {
				await this.leaveClient(client)
				await new Promise((resolve) => setTimeout(resolve, 100))
			} else {
				// check if reconnection is possible
				const channelInstance = this.instances.get(
					currentUserMediaChannel,
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

					this.usersMap.set(client.userId, channelId)

					console.log(
						`[media-channels] User ${client.userId} reconnected to channel ${channelId}`,
					)

					return await channelInstance.joinClient(client, {
						isReconnection: true,
					})
				}

				// clean up stale usersMap entry and do a fresh join
				this.usersMap.delete(client.userId)

				console.log(
					`[media-channels] User ${client.userId} rejoining after channel was closed`,
				)
			}
		}

		// get or create channel instance
		let channelInstance = this.instances.get(channelId)

		if (!channelInstance || channelInstance?.closed === true) {
			channelInstance = await this.createChannelInstance(
				group._id,
				channelId,
			)
		}

		this.usersMap.set(client.userId, channelId)

		return await channelInstance.joinClient(client)
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
