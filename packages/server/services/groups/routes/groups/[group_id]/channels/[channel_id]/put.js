import Groups from "@shared-classes/Spaces/Groups"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(
			req.params.group_id,
			req.auth.session.user_id,
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		return await GroupChannels.update(
			group,
			req.params.channel_id,
			req.body,
			req.auth.session.user_id,
		)
	},
}
