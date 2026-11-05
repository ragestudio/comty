import Groups from "@shared-classes/Spaces/Groups"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"

export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "scylla", "mediaChannels"],
	fn: async (req, res, ctx) => {
		const { group_id, channel_id, user_id } = req.params

		const group = await Groups.get(group_id, { raw: true })

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const authz = await Gatekeeper.forGroup(group, req.auth.user_id)

		// manage_clients is kept as a legacy bypass
		if (!authz.can("VOICE_KICK_MEMBERS") && !authz.can("MANAGE_CLIENTS")) {
			throw new OperationError(
				403,
				"You are not allowed to disconnect clients",
			)
		}

		console.log("disconnecting client", user_id)

		// resolves the owner, the channel may live on another node
		return await ctx.mediaChannels.disconnectUser(channel_id, user_id)
	},
}
