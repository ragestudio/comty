import UserConnections from "@shared-classes/UserConnections"

export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "scylla", "mediaChannels"],
	fn: async (req, res, ctx) => {
		const { group_id } = req.params

		const GroupsModel = ctx.scylla.model("groups")
		const GroupMembershipsModel = ctx.scylla.model("group_memberships")

		const group = await GroupsModel.findOneAsync(
			{ _id: group_id },
			{
				raw: true,
			},
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		group.memberships = await GroupMembershipsModel.findAsync(
			{
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		const membership = group.memberships.find(
			(entry) => entry.user_id === req.auth.session.user_id,
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		let channels = await ctx.mediaChannels.findChannelsByGroupId(group_id)

		// map channel clients
		channels = channels.map((channel) => {
			return {
				_id: channel.data._id,
				clients: Array.from(channel.clients.values()).map((client) => {
					return {
						userId: client.userId,
						voiceStatus: client.voiceStatus,
						self: client.userId === req.auth.session.user_id,
					}
				}),
			}
		})

		// get connected users
		group.connected_members = await UserConnections.isUsersConnected(
			ctx.redis.client,
			group.memberships.map((member) => member.user_id),
		)

		// filter & map connected users ids
		group.connected_members = group.connected_members.filter(
			(c) => c.connected,
		)
		group.connected_members = group.connected_members.map((c) => c.user_id)

		return {
			...group,
			channels: channels,
		}
	},
}
