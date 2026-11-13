import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"

import GroupsModel from "@endpoints/groups"
import UserModel from "@endpoints/user"
import getErrorMessage from "@utils/getErrorMessage"

type SoundpadItemInput = Pick<SoundpadItemPayload, "icon" | "name" | "src">

export type UseSoundpadItemsOptions = {
	scope?: "user" | "group"
	groupId?: string
}

export const useSoundpadItems = ({
	scope = "user",
	groupId,
}: UseSoundpadItemsOptions = {}) => {
	const [items, setItems] = React.useState<SoundpadItemPayload[]>([])
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<Error | null>(null)

	const endpoints = React.useMemo(() => {
		if (scope === "group") {
			if (!groupId) return null

			return {
				list: () => GroupsModel.soundpad.getItems(groupId),
				add: (payload: SoundpadItemInput) =>
					GroupsModel.soundpad.addItem(groupId, payload),
				update: (item: SoundpadItemPayload) =>
					GroupsModel.soundpad.updateItem(groupId, item),
				remove: (itemId: string) =>
					GroupsModel.soundpad.removeItem(groupId, itemId),
			}
		}

		return {
			list: () => UserModel.soundpad.getItems(),
			add: (payload: SoundpadItemInput) =>
				UserModel.soundpad.addItem(payload),
			update: (item: SoundpadItemPayload) =>
				UserModel.soundpad.updateItem(item),
			remove: (itemId: string) => UserModel.soundpad.removeItem(itemId),
		}
	}, [scope, groupId])

	const refresh = React.useCallback(async () => {
		if (!endpoints) return []

		setLoading(true)

		try {
			const response = await endpoints.list()

			setItems(response ?? [])
			setError(null)

			return response
		} catch (err: any) {
			setError(err)
			return []
		} finally {
			setLoading(false)
		}
	}, [endpoints])

	React.useEffect(() => {
		refresh()
	}, [refresh])

	const add = React.useCallback(
		async (payload: SoundpadItemInput) => {
			if (!endpoints) return false

			try {
				await endpoints.add(payload)

				app.message.success("Sound added")
				await refresh()

				return true
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to add sound"))
				return false
			}
		},
		[endpoints, refresh],
	)

	const remove = React.useCallback(
		async (itemId: string) => {
			if (!endpoints) return false

			try {
				await endpoints.remove(itemId)

				await refresh()

				return true
			} catch (error) {
				app.message.error(
					getErrorMessage(error, "Failed to remove sound"),
				)
				return false
			}
		},
		[endpoints, refresh],
	)

	const update = React.useCallback(
		async (item: SoundpadItemPayload) => {
			if (!endpoints) return null

			try {
				const result = await endpoints.update(item)

				await refresh()

				return result
			} catch (error) {
				app.message.error(
					getErrorMessage(error, "Failed to update sound"),
				)
				return null
			}
		},
		[endpoints, refresh],
	)

	return {
		items,
		loading,
		error,
		refresh,
		add,
		update,
		remove,
	}
}
