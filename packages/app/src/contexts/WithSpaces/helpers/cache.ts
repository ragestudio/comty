import { Channels } from "../collections/channel"
import { Group } from "../collections/group"
import { Members } from "../collections/member"

import db from "../store"

// cache group data
export const cacheGroup = async (group: Group): Promise<void> => {
	try {
		await db.groups.put({
			...group,
			channels: { items: [], total_items: 0, has_more: false },
			members: { items: [], total_items: 0, has_more: false },
			cached_at: Date.now(),
		})
	} catch (err) {
		console.error("Error caching group:", err)
	}
}

// cache members list
export const cacheMembers = async (
	group_id: string,
	members: Members,
): Promise<void> => {
	try {
		members.group_id = group_id
		members.cached_at = Date.now()

		await db.members.put(members)
	} catch (err) {
		console.error("Error caching members:", err)
	}
}

// cache channels list
export const cacheChannels = async (
	group_id: string,
	channels: Channels,
): Promise<void> => {
	try {
		channels.group_id = group_id
		channels.cached_at = Date.now()

		await db.channels.put(channels)
	} catch (err) {
		console.error("Error caching channels:", err)
	}
}

// clear cache for a group
export const clearGroupCache = async (group_id: string): Promise<void> => {
	try {
		await db.members.where("group_id").equals(group_id).delete()
		await db.channels.where("group_id").equals(group_id).delete()
		await db.groups.delete(group_id)
	} catch (err) {
		console.error("Error clearing group cache:", err)
	}
}
