import React from "react"

import { filterSettingsByQuery } from "../search"
import { settingsStore } from "../store"

export const useSettingsSearch = () => {
	const tabs = settingsStore((state) => state.tabs)
	const searchQuery = settingsStore((state) => state.searchQuery)
	const searching = Boolean(searchQuery.trim())

	const searchTabs = React.useMemo(() => {
		if (!searching) return []

		return Object.values(tabs).filter((tab) => {
			return (
				filterSettingsByQuery(tab.settings ?? [], searchQuery).length >
				0
			)
		})
	}, [tabs, searchQuery, searching])

	return {
		searchQuery,
		searching,
		searchTabs,
	}
}
