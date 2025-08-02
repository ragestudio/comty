import { Group } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { group_id } = req.params

		const group = await Group.findOne({ _id: group_id }).lean()

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const membership = group.members.find(
			(member) => member.user_id === req.auth.session.user_id,
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		let channels = await global.mediaChannels.findChannelsByGroupId(group_id)

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

		return {
			...group,
			channels: channels,
		}
	},
}
