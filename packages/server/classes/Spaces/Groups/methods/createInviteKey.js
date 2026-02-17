import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (
	group_id,
	issuer_user_id,
	{ maxUsage = 5, expiresAt = null },
) {
	if (
		!GroupPermissions.hasUserPermission(
			issuer_user_id,
			group_id,
			"create_invite_key",
		)
	) {
		throw new OperationError(
			403,
			"You are not allowed to create an invite key for this group",
		)
	}

	const obj = new this.inviteKeyModel({
		group_id: group_id,
		key: nanoid(),
		issuer_user_id: issuer_user_id,
		created_at: new Date().toISOString(),
		expires_at: expiresAt,
		max_usage: maxUsage,
	})

	await obj.saveAsync()

	return obj.toJSON()
}
