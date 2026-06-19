import GroupInviteKeyModel from "@db/group_invite_key"
import type { Group } from "@db/groups"
import type { GroupInviteKey } from "@db/group_invite_key"

export default async function (group: Group): Promise<GroupInviteKey[]> {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	const invites = await GroupInviteKeyModel.find(
		{
			group_id: group._id.toString(),
		},
		{
			raw: true,
		},
	)

	return invites
}
