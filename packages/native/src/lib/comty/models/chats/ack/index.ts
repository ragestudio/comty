import Model from "../../../model"
import { Definition } from "../../../decorators/Definition"

export class Ack extends Model {
	/**
	 * Get unread messages (acks)
	 */
	@Definition(() => ({
		method: "GET",
		url: "/chats/acks",
	}))
	get!: () => Promise<unknown>
}

export default new Ack()
