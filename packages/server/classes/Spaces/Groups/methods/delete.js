import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default async function (group) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	// delete the memberships
	const memberships = await GroupMemberships.getByGroupId(group._id)

	for (const membership of memberships) {
		await GroupMemberships.delete(
			membership.user_id,
			membership._id,
			group._id,
			group,
		)
	}

	// delete the channels
	const channels = await GroupChannels.getAllByGroupId(group)

	for (const channel of channels) {
		await channel.delete()
	}

	await this.model.delete({ _id: group._id })

	return group
}
