import type EventsActions from "./index"

export default function (this: EventsActions, data: { _id: string }): void {
	if (!this.adapter) return

	this.adapter.deleteMessage(data._id).catch(console.error)

	this.setState((state) => ({
		timeline: state.timeline.filter((msg) => msg._id !== data._id),
	}))
}
