import type EventsActions from "./index"

const TYPING_TTL_MS = 8000

const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function clearTypingTimeout(userId: string) {
	const timeout = typingTimeouts.get(userId)

	if (timeout) {
		clearTimeout(timeout)
		typingTimeouts.delete(userId)
	}
}

export default function (this: EventsActions, data: any): void {
	if (!data) return

	const userId = data.user_id || data.user?.id || data.user?._id

	if (!userId) return

	const key = String(userId)
	const generation = this.state.initGeneration

	clearTypingTimeout(key)

	if (data.isTyping) {
		typingTimeouts.set(
			key,
			setTimeout(() => {
				typingTimeouts.delete(key)

				// ignore timers from a previous chat session
				if (this.state.initGeneration !== generation) return

				this.setState((state) => ({
					usersTyping: state.usersTyping.filter(
						(user) => user.id !== userId && user._id !== userId,
					),
				}))
			}, TYPING_TTL_MS),
		)

		this.setState((state) => {
			const isExisting = state.usersTyping.some(
				(user) => user.id === userId || user._id === userId,
			)

			return isExisting
				? state
				: {
						usersTyping: [
							...state.usersTyping,
							{ id: userId, ...data.user },
						],
					}
		})

		return
	}

	this.setState((state) => ({
		usersTyping: state.usersTyping.filter(
			(user) => user.id !== userId && user._id !== userId,
		),
	}))
}
