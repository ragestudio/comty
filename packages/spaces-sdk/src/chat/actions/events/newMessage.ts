import type EventsActions from "./index"
import logger from "@/utils/logger"

export default function (this: EventsActions, data: any): void {
	if (!this.adapter) return

	const { type, params } = this.getState()
	if (!type || !params) return

	const chatId = type === "group" ? params.channel_id : params.to_user_id

	if (data.user) {
		this.cache.cacheUsers([data.user]).catch(logger.error)
	}

	this.adapter.storeMessage(data).catch(logger.error)
	this.adapter
		.updateSyncState({ chat_id: chatId, last_message_id: data._id })
		.catch(logger.error)

	if (!this.state.pausedUpdates) {
		this.getState().actions.pushToTimeline([data], "bottom")
	}
}
