import { Tag } from "antd"

import UserPreview from "@components/UserPreview"
import GroupsModel from "@models/groups"

export default {
	"group-member": async (items, parent, element, control) => {
		const group_id = parent.closest("[data-group-id]").dataset.groupId

		const user_id = element.closest("[data-user-id]").dataset.userId

		const membership_id = element.closest("[data-membership-id]").dataset
			.membershipId

		if (!group_id || !user_id || !membership_id) {
			return items
		}

		const membership = await GroupsModel.members.get(
			group_id,
			membership_id,
		)

		console.debug({ membership })

		items.push({
			render: () => {
				return (
					<div>
						<UserPreview user_id={user_id} />
						{membership.roles.map((role) => {
							return <Tag>{role}</Tag>
						})}
					</div>
				)
			},
		})

		return items
	},
}
