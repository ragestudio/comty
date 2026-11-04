import React from "react"

import { Icons } from "@components/Icons"
import { useGroupActions, useGroupData } from "@comty/spaces-sdk/group"
import getErrorMessage from "@utils/getErrorMessage"

import RoleEditor, { type RoleEditorPayload } from "./components/RoleEditor"
import RolesList from "./components/RolesList"
import { useGroupRoles } from "./useGroupRoles"

import "./index.less"

const PermissionsSettings = () => {
	const group = useGroupData()
	const actions = useGroupActions()
	const groupId = group?._id

	const isOwner =
		group?.is_owner === true ||
		(Boolean(group?.owner_user_id) &&
			group?.owner_user_id === app.userData?._id)

	const {
		roles,
		selectedRole,
		selectedKey,
		setSelectedKey,
		loading,
		error,
		create,
		update,
		remove,
		move,
	} = useGroupRoles(groupId)

	const onSave = async (payload: RoleEditorPayload) => {
		if (!selectedRole) return

		try {
			await update(selectedRole.role_key, payload)

			actions.fetchViewerPermissions()
			actions.fetchMembers()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to update role"))
		}
	}

	const onDelete = async () => {
		if (!selectedRole) return

		try {
			await remove(selectedRole.role_key)

			actions.fetchViewerPermissions()
			actions.fetchMembers()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to delete role"))
		}
	}

	const onMove = async (roleKey: string, direction: number) => {
		try {
			await move(roleKey, direction)

			actions.fetchViewerPermissions()
			actions.fetchMembers()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to reorder roles"))
		}
	}

	const onCreate = async () => {
		try {
			await create()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to create role"))
		}
	}

	if (loading) {
		return <div className="permissions-settings">Loading...</div>
	}

	if (error) {
		return (
			<div className="permissions-settings">
				<p>Failed to load roles: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="permissions-settings">
			<RolesList
				roles={roles}
				selectedKey={selectedKey}
				onSelect={setSelectedKey}
				onCreate={onCreate}
				onMove={onMove}
			/>

			<RoleEditor
				role={selectedRole}
				canEditAdministrator={isOwner}
				onSave={onSave}
				onDelete={onDelete}
			/>
		</div>
	)
}

export default {
	key: "permissions",
	label: "Permissions",
	icon: Icons.Shield,
	permission: "MANAGE_ROLES",
	render: PermissionsSettings,
}
