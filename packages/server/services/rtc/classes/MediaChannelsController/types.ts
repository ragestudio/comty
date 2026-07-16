export interface ConnectionContext {
	id: string
	meta?: {
		user_id?: string
		[key: string]: any
	}
	[key: string]: any
}
