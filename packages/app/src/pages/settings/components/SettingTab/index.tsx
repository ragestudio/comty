import React from "react"
import * as antd from "antd"

import { filterSettingsByQuery } from "../../search"
import { settingsStore } from "../../store"
import type { Setting } from "../../types"
import SettingTabGroups from "./groups"
import SettingTabHeader from "./header"
import SettingTabSettings from "./settings"

interface SettingTabProps {
	baseConfig?: any
	onUpdate?: (key: string, value: any) => void
	withGroups?: boolean
	tabId?: string
	search?: boolean
	showTabHeader?: boolean
	query?: string
}

const SettingTab: React.FC<SettingTabProps> = ({
	baseConfig,
	onUpdate,
	withGroups,
	tabId,
	search,
	showTabHeader,
	query: queryProp,
}) => {
	const activeKey = settingsStore((state) => state.activeKey)
	const tabKey = tabId ?? activeKey
	const tab = settingsStore((state) =>
		tabKey ? state.tabs[tabKey] : undefined,
	)
	const tabGroups = settingsStore((state) =>
		tabKey ? state.tabGroups[tabKey] : undefined,
	)

	const [loading, setLoading] = React.useState(true)
	const [ctxData, setCtxData] = React.useState<any>({})

	React.useEffect(() => {
		let active = true

		const loadTab = async () => {
			setLoading(true)

			if (!tab) {
				if (active) {
					setCtxData({})
					setLoading(false)
				}

				return
			}

			let data = {}

			if (typeof tab.ctxData === "function") {
				data = await tab.ctxData()
			}

			if (!search && typeof tab.onLoad === "function") {
				await tab.onLoad(data)
			}

			if (!active) return

			setCtxData(data)
			setLoading(false)
		}

		loadTab()

		return () => {
			active = false
		}
	}, [tab, search])

	const ctx = React.useMemo(
		() => ({
			baseConfig,
			...ctxData,
		}),
		[baseConfig, ctxData],
	)

	const query = search ? (queryProp ?? "") : ""
	const trimmedQuery = query.trim()

	if (loading) {
		return <antd.Skeleton active />
	}

	if (!tab) {
		return null
	}

	if (tab.render && !search) {
		return React.createElement(tab.render, {
			ctx: ctx,
		})
	}

	const header = showTabHeader ? <SettingTabHeader tab={tab} /> : null

	if (withGroups) {
		const filteredGroups: [string, Setting[]][] = []

		for (const [groupKey, settings] of Object.entries(tabGroups ?? {})) {
			const filteredSettings = filterSettingsByQuery(settings, query)

			if (filteredSettings.length > 0) {
				filteredGroups.push([groupKey, filteredSettings])
			}
		}

		if (search && filteredGroups.length === 0) {
			return null
		}

		return (
			<>
				{header}

				<SettingTabGroups
					groups={filteredGroups}
					ctx={ctx}
					search={search}
					onUpdate={onUpdate}
				/>

				{!trimmedQuery &&
					tab.footer &&
					React.createElement(tab.footer, { ctx })}
			</>
		)
	}

	const filteredSettings = filterSettingsByQuery(tab.settings ?? [], query)

	if (search && filteredSettings.length === 0) {
		return null
	}

	return (
		<>
			{header}

			<SettingTabSettings
				settings={filteredSettings}
				ctx={ctx}
				search={search}
				onUpdate={onUpdate}
			/>

			{!trimmedQuery && tab.footer && React.createElement(tab.footer, { ctx })}
		</>
	)
}

export default React.memo(SettingTab)
