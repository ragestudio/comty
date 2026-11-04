import type { GroupRole } from "@comty/shared/types/spaces/role"

import React from "react"

import GroupsModel from "@endpoints/groups"
import { useGroupRolesVersion } from "@comty/spaces-sdk/group"

import type { RoleEditorPayload } from "./components/RoleEditor"

export const useGroupRoles = (groupId?: string) => {
	const rolesVersion = useGroupRolesVersion()
	const [roles, setRoles] = React.useState<GroupRole[]>([])
	const [selectedKey, setSelectedKey] = React.useState<string | null>(null)
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<Error | null>(null)

	const loadRoles = React.useCallback(async () => {
		if (!groupId) return []

		const response = await GroupsModel.roles.list(groupId)

		return response.items ?? []
	}, [groupId])

	const refresh = React.useCallback(async () => {
		const items = await loadRoles()

		setRoles(items)

		return items
	}, [loadRoles])

	React.useEffect(() => {
		if (!groupId) return

		let cancelled = false

		setLoading(true)

		loadRoles()
			.then((items) => {
				if (cancelled) return

				setRoles(items)
				setSelectedKey((current) => {
					if (current && items.some((role) => role.role_key === current)) {
						return current
					}

					return items.find((role) => !role.is_default)?.role_key ?? null
				})
			})
			.catch((err) => {
				if (!cancelled) setError(err)
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [groupId, loadRoles, rolesVersion])

	const create = React.useCallback(async () => {
		if (!groupId) return

		const role = await GroupsModel.roles.create(groupId, {
			label: "New role",
		})

		setRoles((prev) => [...prev, role].sort((a, b) => b.position - a.position))
		setSelectedKey(role.role_key)

		return role
	}, [groupId])

	const update = React.useCallback(
		async (roleKey: string, payload: RoleEditorPayload) => {
			if (!groupId) return

			await GroupsModel.roles.update(groupId, roleKey, payload)

			await refresh()
		},
		[groupId, refresh],
	)

	const remove = React.useCallback(
		async (roleKey: string) => {
			if (!groupId) return

			await GroupsModel.roles.delete(groupId, roleKey)

			const items = await refresh()

			setSelectedKey(items.find((role) => !role.is_default)?.role_key ?? null)
		},
		[groupId, refresh],
	)

	const move = React.useCallback(
		async (roleKey: string, direction: number) => {
			if (!groupId) return

			const movable = roles.filter((role) => !role.is_default)
			const index = movable.findIndex((role) => role.role_key === roleKey)
			const target = index + direction

			if (index === -1 || target < 0 || target >= movable.length) {
				return
			}

			const next = [...movable]
			;[next[index], next[target]] = [next[target], next[index]]

			await GroupsModel.roles.order(
				groupId,
				next.map((role) => role.role_key),
			)

			await refresh()
		},
		[groupId, roles, refresh],
	)

	const selectedRole =
		roles.find((role) => role.role_key === selectedKey) ?? null

	return {
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
		refresh,
	}
}
