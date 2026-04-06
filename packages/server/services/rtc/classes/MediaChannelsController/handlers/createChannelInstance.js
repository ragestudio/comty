import MediaChannel from "@classes/MediaChannel/index.ts"

export default async function (groupId, channelId) {
	const GroupChannelsModel = global.scylla.model("group_channels")

	// get the channel
	const channel = await GroupChannelsModel.findOne({
		_id: channelId,
		group_id: groupId,
	})

	if (!channel) {
		throw new Error("Channel not found")
	}

	// create the channel instance
	const channelInstance = new MediaChannel({
		data: channel.toRaw(),
		channelId: channelId,
		mediaCodecs: this.constructor.allowedMediaCodecs,
		webrtcServer: this.webrtcServer,
		worker: this.worker,
		controller: this,
	})

	// initialize the channel instance
	await channelInstance.initialize()

	// add the channel instance to the instances map
	this.instances.set(channelId, channelInstance)

	return channelInstance
}
