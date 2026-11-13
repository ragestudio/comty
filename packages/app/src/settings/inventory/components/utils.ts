import { Icons } from "@components/Icons"

export const DECORATION_SLOTS = [
	{ id: "user_card_bg", label: "Profile card", icon: Icons.PanelsTopLeft },
	{ id: "avatar_frame", label: "Avatar frame", icon: Icons.CircleUserRound },
	{ id: "member_bg", label: "Member background", icon: Icons.Wallpaper },
]

const SOURCE_LABELS: Record<string, string> = {
	admin: "Admin grant",
	system: "System grant",
	event: "Event reward",
	code: "Redeem code",
	migration: "Legacy",
}

export const getSourceLabel = (source?: string) => {
	if (!source) return null

	return SOURCE_LABELS[source] ?? source
}

export const formatDate = (value?: string | Date) => {
	if (!value) return null

	const date = value instanceof Date ? value : new Date(value)

	if (Number.isNaN(date.getTime())) return null

	return date.toLocaleDateString()
}

export const getMeta = (entry: any) => {
	return [getSourceLabel(entry.source), formatDate(entry.granted_at)]
		.filter(Boolean)
		.join(" · ")
}
