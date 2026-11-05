import type { MediaChannel as MediaChannelInstance } from "@classes/MediaChannel"
import type MediaChannelsController from "../index"

import MediaChannel from "@classes/MediaChannel"
import GroupChannelsModel from "@db/group_channels"

export default async function (
	this: MediaChannelsController,
	groupId: string,
	channelId: string,
): Promise<MediaChannelInstance> {
	// the lock owner may have already started the instance
	const existing = this.instances.get(channelId)

	if (existing && !existing.closed) {
		return existing
	}

	// get the channel
	const channel = await GroupChannelsModel.findOne({
		_id: channelId,
		group_id: groupId,
	})

	if (!channel) {
		throw new Error("Channel not found")
	}

	const targetSFUNode = await this.pickSfuNode()

	// create the channel instance
	const channelInstance = new MediaChannel(
		{
			data: channel.toRaw(),
			channelId: channelId,
		},
		this,
		targetSFUNode,
	)

	// the state is written with this epoch, a rolling restart on the same node
	// adopts it and any older owner is fenced out
	channelInstance.ownershipEpoch = this.ownership.epochOf(channelId) ?? 0

	// lifecycle events published to the group topic
	this.attachChannelEvents(channelInstance, groupId)

	// initialize the channel instance with the remote router
	await channelInstance.initialize()

	// add the channel instance to the instances map
	this.instances.set(channelId, channelInstance)

	return channelInstance
}
