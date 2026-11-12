import type {
	Setting,
	SettingTabModule,
	SettingsGroup,
} from "@/pages/settings/types"

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators"

const menuGroupOrder = Object.keys(menuGroupsDecorators)
const menuGroupIndex = new Map(
	menuGroupOrder.map((group, index) => [group, index]),
)

function getGroupOrder(group: string) {
	if (group === "bottom") return Number.MAX_SAFE_INTEGER

	return menuGroupIndex.get(group) ?? menuGroupOrder.length
}

function getModuleOrder(module: SettingTabModule) {
	return module.order ?? Number.MAX_SAFE_INTEGER
}

function isSettingAvailable(setting: Setting) {
	if (!app.isMobile && setting.desktop === false) return false
	if (app.isMobile && setting.mobile === false) return false

	return true
}

export function scanSettings(): SettingTabModule[] {
	const modules = import.meta.glob("/src/settings/*/index.{jsx,tsx}", {
		eager: true,
		import: "default",
	})

	return Object.values(modules)
		.filter((module): module is SettingTabModule =>
			Boolean(module && (module as SettingTabModule).group),
		)
		.sort(
			(a, b) =>
				getGroupOrder(a.group) - getGroupOrder(b.group) ||
				getModuleOrder(a) - getModuleOrder(b),
		)
		.map((module) => {
			if (!Array.isArray(module.settings)) return module

			return {
				...module,
				settings: module.settings.filter(isSettingAvailable),
			}
		})
}

export function composeSettingsByGroups(
	settings: SettingTabModule[] = scanSettings(),
): SettingsGroup[] {
	const grouped = new Map<string, SettingTabModule[]>()

	for (const module of settings) {
		const children = grouped.get(module.group)

		if (children) {
			children.push(module)
		} else {
			grouped.set(module.group, [module])
		}
	}

	return Array.from(grouped, ([group, children]) => ({
		group,
		children,
	}))
}

export function composeTabsFromGroups(
	settingsGroups: SettingsGroup[],
): Record<string, SettingTabModule> {
	const tabs: Record<string, SettingTabModule> = {}

	for (const entry of settingsGroups) {
		for (const module of entry.children) {
			if (module.id) tabs[module.id] = module
		}
	}

	return tabs
}

export function composeGroupsFromSettingsTab(
	settings: Setting[] = [],
): Record<string, Setting[]> {
	const groups: Record<string, Setting[]> = {}

	for (const setting of settings) {
		if (!setting.group) continue

		if (!groups[setting.group]) {
			groups[setting.group] = []
		}

		groups[setting.group].push(setting)
	}

	return groups
}
