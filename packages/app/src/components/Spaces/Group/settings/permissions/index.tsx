import React from "react"

import { Icons } from "@components/Icons"
import { useGroupActions, useGroupData } from "@comty/spaces-sdk/group"
import getErrorMessage from "@utils/getErrorMessage"

import RoleEditor, { type RoleEditorPayload } from "./components/RoleEditor"
import RolesList from "./components/RolesList"
import { useGroupRoles } from "./useGroupRoles"

import {
	Settings,
	SettingsContent,
	SettingsHeader,
	SettingsSection,
	SettingsSectionFieldLabel,
} from "@/components/Spaces/Group/SettingsPanel/layout"

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
		return <Settings>Loading...</Settings>
	}

	if (error) {
		return (
			<Settings>
				<p>Failed to load roles: {error.message}</p>
			</Settings>
		)
	}

	return (
		<Settings>
			<SettingsHeader>
				<h2>
					<Icons.ShieldUserIcon />
					Roles & Permissions
				</h2>
			</SettingsHeader>

			<SettingsContent row>
				<SettingsSection>
					<RolesList
						roles={roles}
						selectedKey={selectedKey}
						onSelect={setSelectedKey}
						onCreate={onCreate}
						onMove={onMove}
					/>
				</SettingsSection>

				<SettingsSection
					style={{
						width: "100%",
					}}
				>
					<RoleEditor
						role={selectedRole}
						canEditAdministrator={isOwner}
						onSave={onSave}
						onDelete={onDelete}
					/>
				</SettingsSection>
			</SettingsContent>
		</Settings>
	)
}

export default {
	key: "permissions",
	label: "Permissions",
	icon: Icons.Shield,
	permission: "MANAGE_ROLES",
	render: PermissionsSettings,
}
