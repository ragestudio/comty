import type { Group } from "@db/groups"
import type GroupInvites from "../index"
import type { GroupInviteKey } from "@db/group_invite_key"

export default async function (
	this: typeof GroupInvites,
	group: Group,
	key: string,
): Promise<GroupInviteKey> {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof key !== "string") {
		throw new OperationError(400, "key must be provided")
	}

	const invite = await this.model.findOne({
		group_id: group._id.toString(),
		key: key,
	})

	if (!invite) {
		throw new OperationError(404, "Invite not found")
	}

	await invite.delete()

	return invite.toRaw()
}
