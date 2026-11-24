export const FONT_SLOT_ID = "font"

export const DECORATION_SLOT_IDS = [
	"user_card_bg",
	"avatar_frame",
	"member_bg",
	FONT_SLOT_ID,
]

const SLOT_ALIASES: Record<string, string> = {
	avatar: "avatar_frame",
	avatar_frame: "avatar_frame",
	user_card: "user_card_bg",
	card: "user_card_bg",
	user_card_bg: "user_card_bg",
	member_background: "member_bg",
	member_bg: "member_bg",
	font: FONT_SLOT_ID,
	profile_font: FONT_SLOT_ID,
	custom_font: FONT_SLOT_ID,
}

export const isVideoUrl = (url?: string | null) =>
	typeof url === "string" && /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(url)

export const isFontUrl = (url?: string | null) =>
	typeof url === "string" && /\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(url)

export const isStylesheetFontUrl = (url?: string | null) =>
	typeof url === "string" && /(\.css|\/css2?)(\?|#|$)/i.test(url)

export const getDecorationPreview = (decoration: any): string | null => {
	const preview =
		decoration?.preview_url ?? decoration?.image_obj ?? decoration?.obj_url

	return typeof preview === "string" && preview ? preview : null
}

export const isVideoDecoration = (decoration: any) => {
	const mime = decoration?.mime_type ?? decoration?.mime

	if (typeof mime === "string" && mime.length > 0) {
		return mime.startsWith("video/")
	}

	return isVideoUrl(getDecorationPreview(decoration))
}

export const isFontDecoration = (decoration: any) => {
	if (!decoration) return false

	const explicit = decoration.type ?? decoration.slot

	if (typeof explicit === "string" && explicit) {
		return SLOT_ALIASES[explicit] === FONT_SLOT_ID
	}

	if (decoration.font_family) return true

	return isFontUrl(getFontSource(decoration))
}

export const getFontSource = (decoration: any): string | null => {
	const source = decoration?.obj_url

	return typeof source === "string" && source ? source : null
}

export const getFontFamilyName = (decoration: any): string | null => {
	if (decoration?.font_family) {
		return String(decoration.font_family)
	}

	if (isStylesheetFontUrl(getFontSource(decoration))) {
		return null
	}

	if (decoration?._id) {
		return `comty-font-${decoration._id}`
	}

	return null
}

export const isKnownDecorationSlot = (slot?: string | null) => {
	return typeof slot === "string" && DECORATION_SLOT_IDS.includes(slot)
}

export const resolveDecorationSlot = (decoration: any): string | null => {
	if (!decoration) return null

	const explicit = decoration.type ?? decoration.slot

	if (typeof explicit === "string" && explicit) {
		return SLOT_ALIASES[explicit] ?? explicit
	}

	if (decoration.font_family || isFontUrl(decoration.obj_url)) {
		return FONT_SLOT_ID
	}

	if (decoration.obj_url || decoration.style) {
		return "avatar_frame"
	}

	if (
		decoration.card_style ||
		decoration.gradient_obj ||
		decoration.image_obj_style ||
		decoration.theme_color_values
	) {
		return "user_card_bg"
	}

	if (decoration.image_obj && isVideoUrl(decoration.image_obj)) {
		return "member_bg"
	}

	return null
}
