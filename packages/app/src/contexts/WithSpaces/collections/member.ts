export interface Member {
	_id: string
	group_id: string
	user_id: string
	roles?: any
	created_at: string

	user?: any
	cached_at?: number
}

export interface Members {
	items: Member[]
	total_items?: number
	has_more?: boolean

	group_id?: string
	cached_at?: number
}
