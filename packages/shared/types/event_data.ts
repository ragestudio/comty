export type EventData = {
	event: string | symbol
	data?: any
	error?: any
	ack?: boolean
}

export default EventData
