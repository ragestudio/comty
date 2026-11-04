import type { Member } from "@comty/shared/types/spaces/member"
import type { GroupRole } from "@comty/shared/types/spaces/role"

import React from "react"
import { Select } from "antd"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

export type RoleSelectProps = {
	member: Member
	groupId?: string
	roles: GroupRole[]
	canManageRoles: boolean
	isOwner: boolean
	onRefresh: () => void
}

const RoleSelect = ({
	member,
	groupId,
	roles,
	canManageRoles,
	isOwner,
	onRefresh,
}: RoleSelectProps) => {
	const [saving, setSaving] = React.useState(false)

	if (!canManageRoles) {
		return null
	}

	const currentRoles = member.roles
		.map((role) => role._id)
		.filter((roleId) => roleId !== "member" && roleId !== "owner")

	const options = roles
		.filter((role) => !role.is_default)
		.map((role) => ({
			value: role.role_key,
			label: role.label,
		}))

	if (isOwner && !options.some((option) => option.value === "admin")) {
		options.unshift({ value: "admin", label: "Admin" })
	}

	const onChange = async (nextRoles: string[]) => {
		if (!groupId) return

		const add = nextRoles.filter((role) => !currentRoles.includes(role))
		const remove = currentRoles.filter((role) => !nextRoles.includes(role))

		if (add.length === 0 && remove.length === 0) return

		setSaving(true)

		try {
			await GroupsModel.members.updateRoles(groupId, member._id, {
				add_roles: add,
				remove_roles: remove,
			})

			onRefresh()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to update member roles"))
		} finally {
			setSaving(false)
		}
	}

	return (
		<Select
			mode="multiple"
			size="small"
			loading={saving}
			value={currentRoles}
			options={options}
			placeholder="No roles"
			onChange={onChange}
			style={{ minWidth: 170 }}
		/>
	)
}

export default RoleSelect
