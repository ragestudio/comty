import i18n from "i18next"

import type { Setting } from "./types"

function normalizeSearchValue(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
}

function getSettingSearchText(setting: Setting) {
	return normalizeSearchValue(
		[
			setting.id,
			setting.id_alias ?? "",
			setting.title ?? "",
			setting.title ? i18n.t(setting.title) : "",
			setting.description ?? "",
			setting.description ? i18n.t(setting.description) : "",
		].join(" "),
	)
}

export function filterSettingsByQuery(
	settings: Setting[],
	query: string,
): Setting[] {
	const trimmedQuery = query.trim()

	if (!trimmedQuery) return settings

	const terms = normalizeSearchValue(trimmedQuery)
		.split(/\s+/)
		.filter(Boolean)

	return settings.filter((setting) => {
		const text = getSettingSearchText(setting)

		return terms.every((term) => text.includes(term))
	})
}
