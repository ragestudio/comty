import React from "react"
import { create } from "zustand"

import {
	composeGroupsFromSettingsTab,
	composeSettingsByGroups,
	composeTabsFromGroups,
} from "@/settings"

import type { Setting, SettingTabModule, SettingsGroup } from "./types"

declare const app: any

const QUERY_KEY = "tab"

export type SettingsTabs = Record<string, SettingTabModule>
export type SettingsTabGroups = Record<string, Record<string, Setting[]>>

export interface SettingsNavigateOptions {
	transition?: boolean
	scroll?: boolean
}

export interface SettingsActions {
	init: (defaultKey?: string | null) => void
	navigate: (key: string | null, options?: SettingsNavigateOptions) => void
	back: (options?: SettingsNavigateOptions) => void
	syncFromHistory: () => void
	setSearchQuery: (query: string) => void
}

export interface SettingsStoreType {
	initialized: boolean
	activeKey: string | null
	defaultKey: string | null
	groups: SettingsGroup[]
	tabs: SettingsTabs
	tabGroups: SettingsTabGroups
	searchQuery: string
	actions: SettingsActions
}

const groups = composeSettingsByGroups()
const tabs = composeTabsFromGroups(groups)

function composeTabsGroups(tabsMap: SettingsTabs): SettingsTabGroups {
	const result: SettingsTabGroups = {}

	for (const tab of Object.values(tabsMap)) {
		result[tab.id] = composeGroupsFromSettingsTab(tab.settings)
	}

	return result
}

function getHistoryKey(): string | null {
	if (typeof window === "undefined") return null

	if (app.isDesktop) {
		return history.state?.[QUERY_KEY] ?? null
	}

	return new URLSearchParams(window.location.search).get(QUERY_KEY)
}

function pushHistory(key: string | null) {
	if (typeof window === "undefined") return

	if (app.isDesktop) {
		history.pushState({ [QUERY_KEY]: key }, "")
		return
	}

	if (!key) {
		history.pushState(undefined, "", window.location.pathname)
		return
	}

	history.pushState(undefined, "", `?${QUERY_KEY}=${key}`)
}

export const settingsStore = create<SettingsStoreType>((set, get) => ({
	initialized: false,
	activeKey: null,
	defaultKey: null,
	groups,
	tabs,
	tabGroups: composeTabsGroups(tabs),
	searchQuery: "",
	actions: {
		init: (defaultKey = null) => {
			set({
				initialized: true,
				activeKey: defaultKey,
				defaultKey,
				searchQuery: "",
			})
		},
		navigate: (key, options = {}) => {
			const apply = () => {
				if (get().activeKey === key) return

				set({ activeKey: key })
				pushHistory(key)

				if (options.scroll) {
					app.layout?.scrollTo?.({
						top: 0,
					})
				}
			}

			const startViewTransition =
				typeof document !== "undefined"
					? (document as any).startViewTransition
					: null

			if (options.transition && startViewTransition) {
				return startViewTransition.call(document, apply)
			}

			return apply()
		},
		back: (options) => {
			get().actions.navigate(get().defaultKey, options)
		},
		syncFromHistory: () => {
			set({
				activeKey: getHistoryKey() ?? get().defaultKey,
			})
		},
		setSearchQuery: (query) => {
			set({
				searchQuery: query,
			})
		},
	},
}))

export function useSettingsNavigation(defaultKey: string | null = null) {
	const actions = settingsStore((state) => state.actions)
	const activeKey = settingsStore((state) => state.activeKey)
	const initialized = settingsStore((state) => state.initialized)

	React.useLayoutEffect(() => {
		actions.init(defaultKey)
	}, [actions, defaultKey])

	React.useEffect(() => {
		const handlePopState = () => {
			actions.syncFromHistory()
		}

		window.addEventListener("popstate", handlePopState)

		return () => {
			window.removeEventListener("popstate", handlePopState)
		}
	}, [actions])

	return {
		initialized,
		activeKey,
		actions,
	}
}
