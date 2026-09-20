import type { SettingTab } from "./index.js"

import order from "../settings/order.js"

export default () => {
	const mods = import.meta.glob(["../settings/*/index.{jsx,tsx}"], {
		eager: true,
		import: "default",
	}) as Record<string, SettingTab>

	return Object.values(mods).sort((a, b) => {
		const aOrder = order.findIndex((key) => key === a.key)
		const bOrder = order.findIndex((key) => key === b.key)

		if (aOrder === bOrder) {
			return 0
		}

		return aOrder > bOrder ? 1 : -1
	})
}
