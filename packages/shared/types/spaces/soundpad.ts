export type SoundpadItemScope = "user" | "group" | "builtin"

export const SOUNDPAD_ICON_MAX_LENGTH = 16
export const SOUNDPAD_NAME_MAX_LENGTH = 48
export const SOUNDPAD_SRC_MAX_LENGTH = 2048
export const SOUNDPAD_MAX_DURATION_SECONDS = 10
export const MAX_USER_SOUNDPAD_ITEMS = 25

export interface SoundpadItemPayload {
	_id?: string
	scope?: SoundpadItemScope
	group_id?: string
	user_id: string
	icon: string
	name: string
	src: string
	built_in?: boolean
	created_at?: Date | string
}
