import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default async function (group) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	// delete the memberships
	const memberships = await GroupMemberships.getByGroupId(group._id)

	for (const membership of memberships) {
		await membership.deleteAsync()
	}

	// delete the channels
	const channels = await GroupChannels.getByGroupId(group)

	for (const channel of channels) {
		await channel.deleteAsync()
	}

	await this.model.deleteAsync({ _id: group._id })

	return group
}
