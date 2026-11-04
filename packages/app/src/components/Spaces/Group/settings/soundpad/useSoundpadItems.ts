import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

export const useSoundpadItems = (groupId?: string) => {
	const [items, setItems] = React.useState<SoundpadItemPayload[]>([])
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<Error | null>(null)

	const refresh = React.useCallback(async () => {
		if (!groupId) return []

		setLoading(true)

		try {
			const response = await GroupsModel.soundpad.getItems(groupId)

			setItems(response ?? [])
			setError(null)

			return response
		} catch (err: any) {
			setError(err)
			return []
		} finally {
			setLoading(false)
		}
	}, [groupId])

	React.useEffect(() => {
		refresh()
	}, [refresh])

	const add = React.useCallback(
		async (payload: Pick<SoundpadItemPayload, "icon" | "name" | "src">) => {
			if (!groupId) return

			try {
				await GroupsModel.soundpad.addItem(groupId, payload)

				app.message.success("Sound added")
				await refresh()
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to add sound"))
				throw error
			}
		},
		[groupId, refresh],
	)

	const remove = React.useCallback(
		async (itemId: string) => {
			if (!groupId) return

			try {
				await GroupsModel.soundpad.removeItem(groupId, itemId)

				await refresh()
			} catch (error) {
				app.message.error(
					getErrorMessage(error, "Failed to remove sound"),
				)
				throw error
			}
		},
		[groupId, refresh],
	)

	const update = React.useCallback(
		async (item: SoundpadItemPayload) => {
			if (!groupId) return

			try {
				const result = await GroupsModel.soundpad.updateItem(
					groupId,
					item,
				)

				await refresh()

				return result
			} catch (error) {
				app.message.error(
					getErrorMessage(error, "Failed to update sound"),
				)
				throw error
			}
		},
		[groupId, refresh],
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
