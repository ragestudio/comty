import type { SerializedProducer } from "./producer"
import type { Client } from "./client"

export interface StatedChannel {
	__v?: number
	_id?: string
	clients: Client[]
	producers?: SerializedProducer[]
	started_at?: string | Date | null
}
