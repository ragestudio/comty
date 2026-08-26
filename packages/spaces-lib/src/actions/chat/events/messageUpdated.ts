import type EventsActions from "./index"

export default function (this: EventsActions, data: any): void {
	this.setState((state) => ({
		timeline: state.timeline.map((msg) =>
			msg._id === data._id ? { ...msg, ...data } : msg,
		),
	}))
}
