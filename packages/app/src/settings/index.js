function composeSettingsByGroups() {
	console.time("load settings")

	const modules = import.meta.glob("/src/settings/*/index.jsx", {
		eager: true,
		import: "default",
	})

	let settings = Object.entries(modules)
		.map(([path, module]) => {
			const name = path.split("/").slice(-2, -1)[0]
			return name === "components" || name === "index" ? null : module
		})
		.filter(Boolean)
		.sort((a, b) => (a.group === "bottom") - (b.group === "bottom"))
		.reduce((acc, curr) => {
			const group = curr.group
			;(acc[group] || (acc[group] = [])).push(curr)
			return acc
		}, {})

	settings = Object.entries(settings).map(([group, groupModules]) => {
		const processedModules = groupModules
			.map((module) => {
				if (!Array.isArray(module.settings)) return module

				return {
					...module,
					settings: module.settings.filter((setting) => {
						if (!app.isMobile && setting.desktop === false)
							return false
						if (app.isMobile && setting.mobile === false)
							return false
						return true
					}),
				}
			})
			.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))

		return { group, groupModule: processedModules }
	})

	console.timeEnd("load settings")
	return settings
}

function composeTabsFromGroups(settingsGroups) {
	return settingsGroups.reduce((acc, entry) => {
		entry.groupModule.forEach((item) => {
			if (item.id) acc[item.id] = item
		})
		return acc
	}, {})
}

function composeGroupsFromSettingsTab(settings) {
	return (settings || []).reduce((acc, setting) => {
		if (setting.group) {
			acc[setting.group] = [...(acc[setting.group] || []), setting]
		}
		return acc
	}, {})
}

const composedSettingsByGroups = composeSettingsByGroups()
const composedTabs = composeTabsFromGroups(composedSettingsByGroups)

export {
	composedSettingsByGroups,
	composedTabs,
	composeSettingsByGroups,
	composeTabsFromGroups,
	composeGroupsFromSettingsTab,
}
