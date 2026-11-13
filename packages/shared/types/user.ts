export interface User {
	__v?: number
	cached_at?: number

	_id: string
	user_id: string

	username: string

	public_name?: string
	description?: string

	avatar: string
	cover?: string

	decorations?: Record<string, string>
	links?: Record<string, string>
	// legacy owned badges, replaced by the inventory
	badges?: Array<string>
	// up to two badges displayed on the profile, in order
	profile_badges?: Array<string>

	roles?: string[]
	verified?: boolean

	flags?: string[]
}

export type UserPresenceConnection = {
	userId: string | number
	connected: boolean
	connectionsCount?: number
}
