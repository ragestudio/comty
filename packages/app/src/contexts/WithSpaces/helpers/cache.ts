import { Channels } from "../collections/channel"
import { Group } from "../collections/group"
import { Member, Members } from "../collections/member"
import { User } from "../collections/user"

import db from "../store"

const CACHED_MEMBERS_PER_GROUP_LIMIT = 2000

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

// cache members list — strips user data into separate users table
export const cacheMembers = async (
	group_id: string,
	members: Members,
): Promise<void> => {
	try {
		// extract and cache users separately
		const users = members.items
			.map((m) => m.user)
			.filter((u): u is NonNullable<typeof u> => !!u)

		if (users.length > 0) {
			await cacheUsers(users)
		}

		// store members without nested user data
		const stripped = members.items.map(({ user, ...member }) => ({
			...member,
			group_id: group_id,
			cached_at: Date.now(),
		}))

		await db.members.bulkPut(stripped)

		// enforce per-group member limit (keep most recent)
		const total = await db.members
			.where("group_id")
			.equals(group_id)
			.count()

		if (total > CACHED_MEMBERS_PER_GROUP_LIMIT) {
			const oldest = await db.members
				.where("group_id")
				.equals(group_id)
				.sortBy("cached_at")

			const toDelete = oldest.slice(
				0,
				oldest.length - CACHED_MEMBERS_PER_GROUP_LIMIT,
			)

			await db.members.bulkDelete(toDelete.map((m) => m._id))
		}
	} catch (err) {
		console.error("Error caching members:", err)
	}
}

export const cacheTotalMembers = async (group_id: string, counter: number) => {
	try {
		await db.members_counter.put({
			group_id: group_id,
			counter: counter,
		})
	} catch (err) {
		console.error("Error caching total members:", err)
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

export const cacheUsers = async (users: User[]) => {
	try {
		if (!Array.isArray(users)) {
			throw new Error(`"users" must be a array`)
		}

		const now = Date.now()

		users = users.map((user) => ({
			...user,
			cached_at: now,
		}))

		await db.users.bulkPut(users)
	} catch (error) {
		console.error("Error caching users", error)
	}
}

// resolve cached memberships by injecting user data from the users table
export const resolveCachedMembersUsers = async (
	memberships: Member[],
): Promise<Member[]> => {
	if (!memberships || memberships.length === 0) return memberships

	const userIds = [
		...new Set(memberships.map((m) => m.user_id).filter(Boolean)),
	]

	if (userIds.length === 0) return memberships

	const users = await db.users.bulkGet(userIds)
	const userMap = new Map(users.filter(Boolean).map((u) => [u._id, u]))

	return memberships.map((m) => ({
		...m,
		user: userMap.get(m.user_id) || null,
	}))
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
