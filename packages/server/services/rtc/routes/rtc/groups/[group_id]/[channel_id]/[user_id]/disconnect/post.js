import Groups from "@shared-classes/Spaces/Groups"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
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

		if (
			!(await GroupPermissions.canPerformAction(
				req.auth.user_id,
				group,
				"MANAGE_CLIENTS",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to disconnect clients",
			)
		}

		const channel = ctx.mediaChannels.instances.get(channel_id)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		const client = setFind(
			channel.clients,
			(item) => item.userId === user_id,
		)

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
