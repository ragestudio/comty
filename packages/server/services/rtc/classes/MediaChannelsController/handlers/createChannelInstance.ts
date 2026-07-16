import MediaChannel from "@classes/MediaChannel"
import GroupChannelsModel from "@db/group_channels"

import type MediaChannelsController from "../index"
import type { MediaChannel as MediaChannelInstance } from "@classes/MediaChannel"

export default async function (
	this: MediaChannelsController,
	groupId: string,
	channelId: string,
): Promise<MediaChannelInstance> {
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
		// @ts-ignore
		mediaCodecs: this.constructor.allowedMediaCodecs,
		webrtcServer: this.webrtcServer,
		worker: this.worker,
		controller: this,
	})

	channelInstance.events.on("started", (_ch) => {
		this.sendToGroupTopic(groupId, "vc:started", {
			..._ch.data,
			started_at: _ch.started_at,
			channelId: channelId,
		})
	})

	channelInstance.events.on("closed", (_ch) => {
		this.sendToGroupTopic(groupId, "vc:ended", { channelId: _ch.channelId })
	})

	channelInstance.events.on("client:join", (_ch, client) => {
		this.sendToGroupTopic(groupId, "client:vc:join", {
			userId: client.userId,
			channelId: _ch.channelId,
			user: {
				_id: client.context.user._id,
				username: client.context.user.username,
				avatar: client.context.user.avatar,
			},
			voiceState: client.voiceState,
			channelClients: _ch.getConnectedClientsSerialized(),
		})
	})
	channelInstance.events.on("client:leave", (_ch, client) => {
		this.sendToGroupTopic(groupId, "client:vc:left", {
			userId: client.userId,
			channelId: _ch.channelId,
			channelClients: _ch.getConnectedClientsSerialized(),
		})
	})
	channelInstance.events.on("client:event", (_ch, client, payload) => {
		this.sendToGroupTopic(groupId, "client:vc:event", {
			event: payload.event,
			userId: client.userId,
			channelId: _ch.channelId,
			user: {
				_id: client.context.user._id,
				username: client.context.user.username,
				avatar: client.context.user.avatar,
			},
			data: payload.data,
		})
	})

	channelInstance.events.on("producer:open", (producer) => {
		this.sendToGroupTopic(groupId, "client:vc:producer:open", {
			userId: producer.client.userId,
			channelId: producer.channelId,
			producer: producer.serialize(),
			user: {
				_id: producer.client.context.user._id,
				username: producer.client.context.user.username,
				avatar: producer.client.context.user.avatar,
			},
		})
	})
	channelInstance.events.on("producer:close", (producer) => {
		this.sendToGroupTopic(groupId, "client:vc:producer:close", {
			userId: producer.client.userId,
			channelId: producer.channelId,
			producer: producer.serialize(),
			user: {
				_id: producer.client.context.user._id,
				username: producer.client.context.user.username,
				avatar: producer.client.context.user.avatar,
			},
		})
	})

	// initialize the channel instance
	await channelInstance.initialize()

	// add the channel instance to the instances map
	this.instances.set(channelId, channelInstance)

	return channelInstance
}
