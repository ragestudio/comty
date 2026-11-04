import Groups from "@shared-classes/Spaces/Groups"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import setFind from "@shared-utils/setFind"

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
			throw new OperationError(403, "You are not allowed to disconnect clients")
		}

		const channel = ctx.mediaChannels.instances.get(channel_id)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		const client = setFind(channel.clients, (item) => item.userId === user_id)

		if (!client) {
			throw new OperationError(404, "Client not found with this user id")
		}

		console.log("disconnecting client", user_id)

		await channel.leaveClient(client, { emitEventToSelf: true })

		return {
			ok: true,
			user_id: user_id,
			client_id: client.id,
			channel_id: channel_id,
		}
	},
}
