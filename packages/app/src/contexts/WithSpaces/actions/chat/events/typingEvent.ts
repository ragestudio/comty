import type EventsActions from "./index"

export default function (this: EventsActions, data: any): void {
	if (!data) return

	this.setState((state) => {
		const userId = data.user_id || data.user?.id || data.user?._id
		const prev = state.usersTyping

		if (data.isTyping) {
			const isExisting = prev.some(
				(u) => u.id === userId || u._id === userId,
			)
			return isExisting
				? state
				: { usersTyping: [...prev, { id: userId, ...data.user }] }
		}

		return {
			usersTyping: prev.filter(
				(u) => u.id !== userId && u._id !== userId,
			),
		}
	})
}
