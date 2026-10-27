import type EventsActions from "./index"
import logger from "@/utils/logger"

export default function (this: EventsActions, data: { _id: string }): void {
	if (!this.adapter) return

	this.adapter.deleteMessage(data._id).catch(logger.error)

	this.setState((state) => ({
		timeline: state.timeline.filter((msg) => msg._id !== data._id),
		pendingMessages: state.pendingMessages.filter(
			(msg) => msg._id !== data._id,
		),
	}))
}
