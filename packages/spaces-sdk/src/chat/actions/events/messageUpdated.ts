import type EventsActions from "./index"
import logger from "@comty/shared/utils/logger"

export default function (this: EventsActions, data: any): void {
	if (this.adapter && data?._id) {
		this.adapter.storeMessage(data, this.state.params).catch(logger.error)
	}

	this.setState((state) => ({
		timeline: state.timeline.map((msg) =>
			msg._id === data._id ? { ...msg, ...data } : msg,
		),
		pendingMessages: state.pendingMessages.map((msg) =>
			msg._id === data._id ? { ...msg, ...data } : msg,
		),
	}))
}
