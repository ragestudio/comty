import type { GroupRole } from "@comty/shared/types/spaces/role"
import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

import React from "react"
import { Checkbox, Input } from "antd"

import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"
import { Icons } from "@components/Icons"
import {
	GROUP_PERMISSION_KEYS,
	GROUP_PERMISSION_LABELS,
} from "@comty/shared/types/spaces/permissions"

import { PERMISSION_GROUPS } from "../constants"

export type RoleEditorPayload = {
	label: string
	color?: string
	permissions: Partial<Record<GroupPermission, boolean>>
}

export type RoleEditorProps = {
	role: GroupRole | null
	canEditAdministrator: boolean
	onSave: (payload: RoleEditorPayload) => Promise<void>
	onDelete: () => Promise<void>
}

const rolePermissions = (role: GroupRole | null) => {
	const permissions: Partial<Record<GroupPermission, boolean>> = {}

	for (const permission of GROUP_PERMISSION_KEYS) {
		permissions[permission] = role?.permissions?.[permission] === true
	}

	return permissions
}

const RoleEditor = ({
	role,
	canEditAdministrator,
	onSave,
	onDelete,
}: RoleEditorProps) => {
	const [label, setLabel] = React.useState(role?.label ?? "")
	const [color, setColor] = React.useState(role?.color ?? "#5865f2")
	const [permissions, setPermissions] = React.useState(() =>
		rolePermissions(role),
	)
	const [saving, setSaving] = React.useState(false)

	React.useEffect(() => {
		setLabel(role?.label ?? "")
		setColor(role?.color ?? "#5865f2")
		setPermissions(rolePermissions(role))
	}, [role])

	if (!role) {
		return <div className="permissions-settings__empty">Select a role</div>
	}

	const isEditable = role.role_key !== "owner"
	const canDelete = isEditable && role.role_key !== "member"

	const togglePermission = (permission: GroupPermission) => {
		setPermissions((prev) => ({
			...prev,
			[permission]: !prev[permission],
		}))
	}

	const submit = async () => {
		if (!isEditable) return

		setSaving(true)

		try {
			await onSave({
				label,
				color,
				permissions,
			})
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="permissions-settings__editor">
			<div className="permissions-settings__field">
				<span>Role name</span>
				<Input
					value={label}
					disabled={!isEditable}
					onChange={(event) => setLabel(event.target.value)}
				/>
			</div>

			<div className="permissions-settings__field">
				<span>Color</span>
				<input
					type="color"
					value={color}
					disabled={!isEditable}
					onChange={(event) => setColor(event.target.value)}
				/>
			</div>

			<div className="permissions-settings__permissions">
				{PERMISSION_GROUPS.map((group) => (
					<div
						key={group.label}
						className="permissions-settings__permissions__group"
					>
						<h4>{group.label}</h4>

						{group.keys.map((permission) => {
							if (permission === "ADMINISTRATOR" && !canEditAdministrator) {
								return null
							}

							return (
								<Checkbox
									key={permission}
									checked={permissions[permission] === true}
									disabled={!isEditable}
									onChange={() => togglePermission(permission)}
								>
									{GROUP_PERMISSION_LABELS[permission]}
								</Checkbox>
							)
						})}
					</div>
				))}
			</div>

			{isEditable && (
				<div className="permissions-settings__actions">
					{canDelete && (
						<ConfirmButton
							icon={<Icons.Trash />}
							onConfirm={onDelete}
						>
							Delete role
						</ConfirmButton>
					)}

					<Button
						type="primary"
						loading={saving}
						disabled={label.trim().length === 0}
						onClick={submit}
					>
						Save
					</Button>
				</div>
			)}
		</div>
	)
}

export default RoleEditor
