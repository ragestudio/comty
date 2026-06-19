import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import { nanoid } from "nanoid"
import type Groups from "../index"

export default async function (
	this: typeof Groups,
	group_id: string,
	issuer_user_id: string,
	{ maxUsage = 5, expiresAt = null }: any = {},
) {
	if (
		!(await GroupPermissions.canPerformAction(
			issuer_user_id,
			group_id,
			"MANAGE_INVITES",
		))
	) {
		throw new OperationError(
			403,
			"You are not allowed to create an invite key for this group",
		)
	}

	const obj = this.inviteKeyModel.obj({
		group_id: group_id,
		key: nanoid(),
		issuer_user_id: issuer_user_id,
		created_at: new Date(),
		expires_at: expiresAt,
		max_usage: maxUsage,
	})

	await obj.save()

	return obj.toRaw()
}
