import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupInvites from "@shared-classes/Spaces/GroupInvites"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_INVITES")

		return await GroupInvites.create(authz.group, {
			issuer_user_id: authz.userId,
			max_usage: req.body?.max_usage ?? 5,
			expires_at: req.body?.expires_at,
		})
	},
}
