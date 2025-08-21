import ChatChannel from "../ChatChannel"

export default class ChatChannelsController {
	constructor(server) {
		this.server = server
	}

	get = async (group_id, channel_id, user_id) => {
		const GroupChannelsModel =
			this.server.contexts.scylla.model("group_channels")
		const GroupMembershipsModel =
			this.server.contexts.scylla.model("group_memberships")

		const channel = await GroupChannelsModel.findOneAsync(
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

		const membership = await GroupMembershipsModel.findOneAsync(
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

	create = async (client, payload) => {}
}
