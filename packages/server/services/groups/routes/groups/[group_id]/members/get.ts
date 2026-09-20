import type { PaginatedResponse } from "@comty/shared/types/pagination"
import type { Member } from "@comty/shared/types/spaces/member"

import User from "@db_models/user"
import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req): Promise<PaginatedResponse<Member>> => {
		const { limit = 50, offset } = req.query

		const group = await Groups.get(req.params.group_id, req.auth.user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupPermissions.canPerformAction(
				req.auth.user_id,
				group,
				"READ_MEMBERSHIPS",
			))
		) {
			throw new OperationError(403, "You are not allowed to read members")
		}

		const totalMembers = await GroupMemberships.getTotalMembersByGroupId(
			group._id,
		)

		let items = (
			await GroupMemberships.getAllByGroupId(group._id, {
				limit: limit,
				offset: offset,
				raw: false,
			})
		).map((i) => i.toRaw()) as unknown as Member[]

		items = items.map((item) => {
			if (!Array.isArray(item.roles)) {
				item.roles = []
			}

			item.roles.push({
				_id: "member",
				label: "Member",
			})

			if (item.user_id === group.owner_user_id) {
				item.roles.push({
					_id: "owner",
					label: "Owner",
					color: "orange",
				})
			}

			return item
		})

		let users = await User.find({
			_id: {
				$in: items.map((item) => item.user_id),
			},
		}).lean()

		const usersMap = new Map(
			users.map((user) => [user._id.toString(), user]),
		)

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

		return {
			total_items: totalMembers,
			items: items,
		}
	},
}
