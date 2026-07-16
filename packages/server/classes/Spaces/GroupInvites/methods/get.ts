import type { Group } from "@db/groups"
import type GroupInvites from "../index"

export default async function (
	this: typeof GroupInvites,
	group: Group,
	key: string,
	{ raw = true }: { raw?: boolean } = {},
): Promise<any> {
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

	if (raw === true) {
		return invite.toRaw()
	}

	return invite
}
