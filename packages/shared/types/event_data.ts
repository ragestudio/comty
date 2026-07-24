export type EventData = {
	event: string | symbol
	data?: any
	error?: any
	ack?: boolean
}

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

export function EventDataEncode(
	event: string | symbol,
	data: any,
	error?: any,
	ack?: boolean,
): Uint8Array {
	return textEncoder.encode(JSON.stringify({ event, data, error, ack }))
}

export function EventDataDecode(data: string | Uint8Array): EventData {
	if (data instanceof Uint8Array) {
		data = textDecoder.decode(data)
	}

	return JSON.parse(data)
}
