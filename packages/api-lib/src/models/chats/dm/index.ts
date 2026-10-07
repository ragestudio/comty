import Model from "../../../model"
import { Definition } from "../../../decorators/Definition"

export class DMModel extends Model {
	/**
	 * List all DM rooms
	 */
	@Definition((params) => ({
		method: "GET",
		url: `/chats/dm`,
		params: params,
	}))
	list!: (params?: object) => Promise<Record<string, any>>

	messages = new DMMessagesMethods()
}

class DMMessagesMethods extends Model {
	/**
	 * Get messages from a DM chat
	 */
	@Definition((to_user_id, params) => ({
		method: "GET",
		url: `/chats/dm/${to_user_id}`,
		params: params,
	}))
	get!: (to_user_id: string, params?: object) => Promise<Record<string, any>>

	/**
	 * Send a message to a DM chat
	 */
	@Definition((to_user_id, payload) => ({
		method: "POST",
		url: `/chats/dm/${to_user_id}`,
		data: payload,
	}))
	send!: (to_user_id: string, payload: object) => Promise<Record<string, any>>

	/**
	 * Delete a message from a DM chat
	 */
	@Definition((to_user_id, message_id) => ({
		method: "DELETE",
		url: `/chats/dm/${to_user_id}/${message_id}`,
	}))
	delete!: (
		to_user_id: string,
		message_id: string,
	) => Promise<Record<string, any>>
}

export default new DMModel()
