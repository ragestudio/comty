import React from "react"
import { getSocket } from "./useChatSocket"

export function useChatTyping(config: any, params: any) {
	const [isTyping, setIsTyping] = React.useState(false)
	const [usersTyping, setUsersTyping] = React.useState<any[]>([])

	const typingTimeout = React.useRef<any>(null)
	const isTypingNetworkState = React.useRef(false)
	const paramsRef = React.useRef(params)

	React.useEffect(() => {
		paramsRef.current = params
	}, [params])

	const handleTypingEvent = React.useCallback((data: any) => {
		setUsersTyping((prev) => {
			const userId = data.user_id || data.user?.id || data.user?._id

			if (data.isTyping) {
				const isExisting = prev.some(
					(u) => u.id === userId || u._id === userId,
				)

				return isExisting
					? prev
					: [...prev, { id: userId, ...data.user }]
			}

			return prev.filter((u) => u.id !== userId && u._id !== userId)
		})
	}, [])

	const typing = React.useCallback(
		(isTypingNow = true) => {
			setIsTyping(isTypingNow)

			if (typingTimeout.current) {
				clearTimeout(typingTimeout.current)
			}

			if (isTypingNetworkState.current !== isTypingNow) {
				isTypingNetworkState.current = isTypingNow

				getSocket()
					?.call(
						config.methods.typing,
						config.params.typing(paramsRef.current, isTypingNow),
					)
					.catch((err: any) =>
						console.error("error setting typing state:", err),
					)
			}

			if (isTypingNow) {
				typingTimeout.current = setTimeout(() => typing(false), 5000)
			}
		},
		[config],
	)

	const resetTyping = React.useCallback(() => {
		setUsersTyping([])
		setIsTyping(false)
		isTypingNetworkState.current = false
		if (typingTimeout.current) {
			clearTimeout(typingTimeout.current)
		}
	}, [])

	React.useEffect(() => {
		return () => {
			if (typingTimeout.current) {
				clearTimeout(typingTimeout.current)
			}
		}
	}, [])

	return {
		isTyping,
		usersTyping,
		typing,
		handleTypingEvent,
		resetTyping,
	}
}
