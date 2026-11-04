import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import User from "@db_models/user"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.body ?? {}

		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_MEMBERSHIPS")

		const user = await User.findById(user_id)
			.lean()
			.catch(() => null)

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		return await GroupMemberships.create(authz.group._id, user_id)
	},
}
