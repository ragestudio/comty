import type { Server } from "linebridge"

import Groups from "@shared-classes/Spaces/Groups"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"

import GroupChatChannel from "./instance"

export default class GroupChatChannelController {
	constructor(server: Server) {
		this.server = server
	}

	server: Server

	get = async (group_id: string, channel_id: string, user_id: string) => {
		const group = await Groups.get(group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		// resolve the context once per request and reuse it for the
		// channel operations (read/write/delete)
		const authz = await Gatekeeper.forGroup(group as any, user_id)

		authz.require("READ_CHANNELS", "You are not allowed to read this channel")

		const channel = await GroupChannels.model.findOne({
			group_id: group._id,
			_id: channel_id,
		})

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		if (channel.kind !== "chat") {
			throw new OperationError(400, "This channel is not a chat")
		}

		return new GroupChatChannel(this, channel, { authz })
	}
}
