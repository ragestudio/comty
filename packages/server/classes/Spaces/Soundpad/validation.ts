import {
	SOUNDPAD_ICON_MAX_LENGTH,
	SOUNDPAD_NAME_MAX_LENGTH,
	SOUNDPAD_SRC_MAX_LENGTH,
} from "@comty/shared/types/spaces/soundpad"

export type SoundpadItemInput = {
	icon: string
	name: string
	src: string
}

export type SoundpadDispatchInput = {
	src?: string
	icon?: string
}

export function normalizeSoundpadSrc(src: unknown) {
	if (
		typeof src !== "string" ||
		src.trim().length === 0 ||
		src.trim().length > SOUNDPAD_SRC_MAX_LENGTH
	) {
		throw new OperationError(400, "Invalid src")
	}

	const value = src.trim()

	try {
		const url = new URL(value)

		if (url.protocol !== "https:") {
			throw new Error("invalid protocol")
		}
	} catch {
		throw new OperationError(400, "src must be a valid HTTPS URL")
	}

	return value
}

export function normalizeSoundpadItem(input: SoundpadItemInput) {
	if (typeof input.icon !== "string" || input.icon.trim().length === 0) {
		throw new OperationError(400, "Missing icon")
	}

	const icon = input.icon.trim().slice(0, SOUNDPAD_ICON_MAX_LENGTH)

	if (typeof input.name !== "string" || input.name.trim().length === 0) {
		throw new OperationError(400, "Missing name")
	}

	const name = input.name.trim().slice(0, SOUNDPAD_NAME_MAX_LENGTH)

	return {
		icon: icon,
		name: name,
		src: normalizeSoundpadSrc(input.src),
	}
}

export function normalizeSoundpadDispatch(input: SoundpadDispatchInput = {}) {
	const icon =
		typeof input.icon === "string"
			? input.icon.trim().slice(0, SOUNDPAD_ICON_MAX_LENGTH)
			: ""

	return {
		src: normalizeSoundpadSrc(input.src),
		icon: icon,
	}
}
