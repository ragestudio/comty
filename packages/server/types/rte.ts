declare interface RTEClient {
	engine: any
	socket: {
		remoteAddress?: string
		request?: {
			connection?: {
				remoteAddress?: string
			}
			headers?: {
				"x-forwarded-for"?: string
			}
		}
	}

	id: string
	ip?: string

	userId: string | null
	authenticated: boolean

	context: {
		user: {
			_id: string
			username: string
			avatar: string
		}
	}

	emit: (event: string, payload: any) => Promise<any>
	toTopic: (
		topic: string,
		event: string,
		data: any,
		self: boolean,
	) => Promise<void>
	error: (error: Error) => Promise<void>
	ack: (eventKey: string, data: any, error: Error) => Promise<void>
	subscribe: (topic: string) => Promise<void>
	unsubscribe: (topic: string) => Promise<void>
	unsubscribeAll: () => Promise<void>
}
