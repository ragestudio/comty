import type MediaChannelsController from ".."
import type { MediaChannel } from "@classes/MediaChannel"

/**
 * Publishes the channel lifecycle to the group topic. It is shared by the
 * created and the restored instances, a session adopted from the state bucket
 * must emit the same events as a fresh one.
 */
export default function (
	this: MediaChannelsController,
	channelInstance: MediaChannel,
	groupId: string,
) {
	channelInstance.events.on("started", (_ch) => {
		this.sendToGroupTopic(groupId, "vc:started", {
			..._ch.data,
			started_at: _ch.started_at,
			channelId: _ch.channelId,
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
				_id: client?.context?.user?._id,
				username: client?.context?.user?.username,
				avatar: client?.context?.user?.avatar,
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
				_id: client?.context?.user?._id,
				username: client?.context?.user?.username,
				avatar: client?.context?.user?.avatar,
			},
			data: payload.data,
			voiceState: client.voiceState,
		})
	})

	channelInstance.events.on("producer:open", (producer) => {
		this.sendToGroupTopic(groupId, "client:vc:producer:open", {
			userId: producer.client.userId,
			channelId: producer.channelId,
			producer: producer.serialize(),
			user: {
				_id: producer.client?.context?.user?._id,
				username: producer.client?.context?.user?.username,
				avatar: producer.client?.context?.user?.avatar,
			},
		})
	})

	channelInstance.events.on("producer:close", (producer) => {
		this.sendToGroupTopic(groupId, "client:vc:producer:close", {
			userId: producer.client.userId,
			channelId: producer.channelId,
			producer: producer.serialize(),
			user: {
				_id: producer.client?.context?.user?._id,
				username: producer.client?.context?.user?.username,
				avatar: producer.client?.context?.user?.avatar,
			},
		})
	})
}
