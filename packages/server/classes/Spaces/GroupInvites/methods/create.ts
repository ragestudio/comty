import type { Group } from "@db/groups"
import type GroupInvites from "../index"
import type { GroupInviteKey } from "@db/group_invite_key"

export default async function (
	this: typeof GroupInvites,
	group: Group,
	payload: { issuer_user_id: string; max_usage?: number | string },
): Promise<GroupInviteKey> {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof payload !== "object") {
		throw new OperationError(400, "payload must be provided")
	}

	if (!payload.issuer_user_id) {
		throw new OperationError(400, "issuer_user_id must be provided")
	}

	const invite = this.model.obj({
		group_id: group._id.toString(),
		key: global.nanoid(),
		issuer_user_id: payload.issuer_user_id,
		max_usage: parseInt(payload.max_usage.toString()) ?? 5,
		created_at: new Date(),
	})

	await invite.save()

	return invite.toRaw()
}
