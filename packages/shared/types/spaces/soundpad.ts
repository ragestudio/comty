export interface SoundpadItemPayload {
	_id?: string
	group_id: string
	user_id: string
	icon: string
	name: string
	src: string
	built_in?: boolean
	created_at?: Date | string
}
