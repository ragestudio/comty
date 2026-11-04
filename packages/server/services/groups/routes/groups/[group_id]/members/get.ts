import type { PaginatedResponse } from "@comty/shared/types/pagination"
import type { Member } from "@comty/shared/types/spaces/member"

import User from "@db_models/user"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"
import { resolveMemberRoles } from "@shared-classes/Spaces/GroupRoles/helpers"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

const escapeRegex = (value: string) => {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const parseLimit = (value: unknown): number => {
	const limit = Number.parseInt(String(value ?? DEFAULT_LIMIT), 10)

	if (!Number.isFinite(limit) || limit <= 0) {
		return DEFAULT_LIMIT
	}

	return Math.min(limit, MAX_LIMIT)
}

const attachUsers = async (items: Member[]) => {
	if (items.length === 0) return items

	const users = await User.find({
		_id: {
			$in: items.map((item) => item.user_id),
		},
	}).lean()

	const usersMap = new Map(users.map((user) => [String(user._id), user]))

	for (const item of items) {
		const userEntry = usersMap.get(item.user_id)

		if (userEntry) {
			// @ts-ignore
			item.user = {
				user_id: String(userEntry._id),
				...userEntry,
			}
		}
	}

	return items
}

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req): Promise<PaginatedResponse<Member>> => {
		const { limit: rawLimit, offset = null, search } = req.query
		const limit = parseLimit(rawLimit)

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_MEMBERSHIPS")

		const group = authz.group

		let items: Member[] = []
		let totalMembers = 0

		if (typeof search === "string" && search.trim().length > 0) {
			// search by username, then keep only the memberships of this group
			const users = await User.find({
				username: {
					$regex: escapeRegex(search.trim()),
					$options: "i",
				},
			})
				.limit(limit)
				.lean()

			const userIds = users.map((user) => String(user._id))

			if (userIds.length > 0) {
				items = (await GroupMemberships.model.find(
					{
						group_id: group._id,
						user_id: {
							$in: userIds,
						},
					},
					{
						raw: true,
					},
				)) as unknown as Member[]
			}

			totalMembers = items.length
		} else {
			totalMembers = await GroupMemberships.getTotalMembersByGroupId(group._id)

			items = (
				await GroupMemberships.getAllByGroupId(group._id, {
					limit: limit,
					offset: typeof offset === "string" ? offset : undefined,
					raw: false,
				})
			).map((membership) => membership.toRaw()) as unknown as Member[]
		}

		const groupRoles = await GroupRoles.getByGroupId(group._id)
		const rolesByKey = new Map(groupRoles.map((role) => [role.role_key, role]))

		items = items.map((item) => {
			item.roles = resolveMemberRoles(
				item.roles,
				rolesByKey,
				item.user_id === group.owner_user_id,
			)

			return item
		})

		await attachUsers(items)

		return {
			total_items: totalMembers,
			items: items,
			has_more:
				typeof search === "string" && search.trim().length > 0
					? false
					: items.length === limit,
		}
	},
}
