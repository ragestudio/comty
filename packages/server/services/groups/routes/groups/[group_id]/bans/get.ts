import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupBans from "@shared-classes/Spaces/GroupBans"
import User from "@db_models/user"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("BAN_MEMBERS")

		const bans = await GroupBans.list(authz.group._id)

		if (bans.length === 0) {
			return { items: [] }
		}

		const users = await User.find({
			_id: {
				$in: bans.map((ban) => ban.user_id),
			},
		}).lean()

		const usersMap = new Map(users.map((user) => [String(user._id), user]))

		return {
			items: bans.map((ban) => ({
				...ban,
				user: usersMap.get(ban.user_id),
			})),
		}
	},
})
