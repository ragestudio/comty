import ChatChannel from "../ChatChannel"

export default class ChatChannelsController {
	constructor(server) {
		this.server = server
	}

	get GroupChannelsModel() {
		return this.server.contexts.scylla.model("group_channels")
	}

	get GroupMembershipsModel() {
		return this.server.contexts.scylla.model("group_memberships")
	}

	get = async (group_id, channel_id, user_id) => {
		const channel = await this.GroupChannelsModel.findOneAsync(
			{
				_id: channel_id,
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		if (channel.kind !== "chat") {
			throw new OperationError(400, "This channel is not a chat")
		}

		const membership = await this.GroupMembershipsModel.findOneAsync(
			{
				group_id: group_id,
				user_id: user_id,
			},
			{
				raw: true,
			},
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		return new ChatChannel(this, channel)
	}
}
