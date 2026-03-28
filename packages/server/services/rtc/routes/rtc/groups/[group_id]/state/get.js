import UserConnections from "@shared-classes/UserConnections"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "scy", "scylla", "mediaChannels"],
	fn: async (req, res, ctx) => {
		const { group_id } = req.params

		const GroupsModel = ctx.scy.model("groups")

		const group = await GroupsModel.findOne(
			{ _id: group_id },
			{ raw: true },
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupMemberships.isUserIdOnMembers(
				req.auth.session.user_id,
				group_id,
			))
		) {
			throw new OperationError(403, "You are not a member of this group")
		}

		let state = {
			group: group,
			memberships: (await GroupMemberships.getByGroupId(group_id)) ?? [],
			channels:
				(await ctx.mediaChannels.findChannelsByGroupId(group_id)) ?? [],
			connected_members: [],
		}

		if (Array.isArray(state.channels)) {
			// map channel clients
			state.channels = state.channels.map((channel) => {
				return {
					__v: channel.data.__v,
					_id: channel.data._id,
					clients: channel.getConnectedClientsSerialized(),
					producers: channel.getProducersSerialized(),
					started_at: channel.started_at,
				}
			})
		}

		// get connected users
		if (Array.isArray(state.memberships) && state.memberships.length > 0) {
			state.connected_members = await UserConnections.isUsersConnected(
				ctx.redis.client,
				state.memberships.map((member) => member.user_id),
			)

			// filter & map connected users ids
			state.connected_members = state.connected_members.filter(
				(c) => c.connected,
			)
			state.connected_members = state.connected_members.map(
				(c) => c.user_id,
			)
		}

		return state
	},
}
