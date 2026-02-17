import Groups from "@shared-classes/Spaces/Groups"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

import ChatChannel from "@classes/ChatChannel"

export default class GroupChatChannelController {
	constructor(server) {
		this.server = server
	}

	get = async (group_id, channel_id, user_id) => {
		const group = await Groups.get(group_id, user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		let channel = await GroupChannels.get(group, channel_id, user_id)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		channel = channel.toJSON()

		if (channel.kind !== "chat") {
			throw new OperationError(400, "This channel is not a chat")
		}

		return new ChatChannel(this, channel, {
			topic: "chats:channel",
		})
	}
}
