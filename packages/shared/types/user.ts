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

	roles?: string[]
	verified?: boolean
}
