import Model from "../../../model"
import { Definition } from "../../../decorators/Definition"

export type SyncParams = {
	last_synced_at?: number | string
	last_message_id?: number | string
}

export class Channels extends Model {
	/**
	 * Get sync a channel chat by group and channel ID
	 */
	@Definition((group_id, channel_id, params) => ({
		method: "GET",
		url: `/chats/channels/${group_id}/${channel_id}/sync`,
		params: params,
	}))
	sync!: (
		group_id: string,
		channel_id: string,
		params?: SyncParams,
	) => Promise<Record<string, any>>

	messages = new ChannelsMessagesMethods()
}

class ChannelsMessagesMethods extends Model {
	/**
	 * Get messages from a channel chat by group and channel ID.
	 */
	@Definition((group_id, channel_id, params) => ({
		method: "GET",
		url: `/chats/channels/${group_id}/${channel_id}`,
		params: params,
	}))
	get!: (
		group_id: string,
		channel_id: string,
		params?: any,
	) => Promise<Record<string, any>>

	/**
	 * Send a message to a channel chat by group and channel ID.
	 */
	@Definition((group_id, channel_id, payload) => ({
		method: "POST",
		url: `/chats/channels/${group_id}/${channel_id}`,
		data: payload,
	}))
	send!: (
		group_id: string,
		channel_id: string,
		payload?: any,
	) => Promise<Record<string, any>>

	/**
	 * Delete a message from a channel chat by group and channel ID
	 */
	@Definition((group_id, channel_id, message_id) => ({
		method: "DELETE",
		url: `/chats/channels/${group_id}/${channel_id}/${message_id}`,
	}))
	delete!: (
		group_id: string,
		channel_id: string,
		message_id: string,
	) => Promise<Record<string, any>>
}

export default new Channels()
