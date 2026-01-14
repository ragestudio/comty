export default class GroupRoles {
	static get model() {
		return global.scylla.model("group_roles")
	}

	static async getByGroupId(group_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const roles = await this.model.findAsync(
			{
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		// add the default member role
		roles.push({
			role_key: "member",
			permissions: [
				"READ_CHANNELS",
				"WRITE_CHANNELS",
				"READ_MEMBERSHIPS",
				"MANAGE_INVITES",
			],
		})

		return roles
	}
}
