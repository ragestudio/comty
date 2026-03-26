export interface Member {
	_id: string
	user_id: string
	user: any
}

export interface Members {
	items: Member[]
	total_items: number
	has_more?: boolean
}
