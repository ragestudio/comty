export type PaginatedRequest = {
	page?: number
	limit?: number
	offset?: number
}

export type PaginatedResponse<T = any> = {
	items: T[]
	total_items: number
	has_more?: boolean
	page?: number
	limit?: number
}
