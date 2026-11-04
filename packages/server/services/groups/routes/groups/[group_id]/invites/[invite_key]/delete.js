import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupInvites from "@shared-classes/Spaces/GroupInvites"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_INVITES")

		return await GroupInvites.delete(authz.group, req.params.invite_key)
	},
}
