import MediaChannel from "@classes/MediaChannel"

export default async function (groupId, channelId) {
	const GroupChannelsModel = global.scylla.model("group_channels")

	// get the channel
	const channel = await GroupChannelsModel.findOneAsync({
		_id: channelId,
		group_id: groupId,
	})

	if (!channel) {
		throw new Error("Channel not found")
	}

	// create the channel instance
	const channelInstance = new MediaChannel({
		data: channel.toJSON(),
		channelId: channelId,
		worker: this.worker,
		mediaCodecs: this.constructor.allowedMediaCodecs,
	})

	// initialize the channel instance
	await channelInstance.initialize()

	// add the channel instance to the instances map
	this.instances.set(channelId, channelInstance)

	return channelInstance
}
