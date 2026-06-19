import GroupChannels from ".."
import { GroupChannel } from "@db/group_channels"
import { Group } from "@db/groups"

// TODO: use a atomic counter instead fetching all channels data
export default async function (group: Group, user_id?: string) {
	const channels = (await GroupChannels.getAllByGroup(
		group,
		user_id,
	)) as GroupChannel[]

	return channels.length
}
