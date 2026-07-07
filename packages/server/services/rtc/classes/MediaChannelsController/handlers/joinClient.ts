import GroupChannelsModel from "@db/group_channels"

import type MediaChannelsController from "../index"
import { RTCClient } from "@services/rtc/types"

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

		const currentUserMediaChannel = this.usersMap.get(client.userId)

		// Cleanup existing connection if any
		if (currentUserMediaChannel) {
			await this.leaveClient(client)
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		// Get or create channel instance
		let channelInstance = this.instances.get(channelId)

		if (!channelInstance || channelInstance?.closed === true) {
			channelInstance = await this.createChannelInstance(
				group._id,
				channelId,
			)
		}

		// Set client channel
		this.usersMap.set(client.userId, channelId)

		return await channelInstance.joinClient(client)
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
