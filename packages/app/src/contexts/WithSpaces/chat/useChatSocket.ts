import React from "react"

export const getSocket = () =>
	globalThis.__comty_shared_state?.ws?.sockets?.get("main")

export function useChatSocket({
	config,
	params,
	depKey,
	onNewMessage,
	onMessageUpdated,
	onMessageDeleted,
	onTyping,
}: any) {
	const [error, setError] = React.useState<Error | null>(null)

	// use refs to avoid unnecessary resubscriptions
	const callbacksRef = React.useRef({
		onNewMessage,
		onMessageUpdated,
		onMessageDeleted,
		onTyping,
	})

	React.useEffect(() => {
		callbacksRef.current = {
			onNewMessage,
			onMessageUpdated,
			onMessageDeleted,
			onTyping,
		}
	})

	React.useEffect(() => {
		const socket = getSocket()

		if (!socket) {
			setError(new Error("chat websocket not available or found"))
			return
		}

		setError(null)

		const subscribeParams = config.params.subscribe(params)

		const handleNewMessage = (data: any) =>
			callbacksRef.current.onNewMessage?.(data)
		const handleMessageUpdated = (data: any) =>
			callbacksRef.current.onMessageUpdated?.(data)
		const handleMessageDeleted = (data: any) =>
			callbacksRef.current.onMessageDeleted?.(data)
		const handleTypingEvent = (data: any) =>
			callbacksRef.current.onTyping?.(data)

		socket.on(config.events.message, handleNewMessage)
		socket.on(config.events.messageUpdated, handleMessageUpdated)
		socket.on(config.events.messageDeleted, handleMessageDeleted)
		socket.on(config.events.typing, handleTypingEvent)

		socket.topics
			.subscribe(config.methods.subscribe, subscribeParams)
			.catch(console.error)

		return () => {
			socket.off(config.events.message, handleNewMessage)
			socket.off(config.events.messageUpdated, handleMessageUpdated)
			socket.off(config.events.messageDeleted, handleMessageDeleted)
			socket.off(config.events.typing, handleTypingEvent)

			socket.topics
				.unsubscribe(config.methods.unsubscribe, subscribeParams)
				.catch(console.error)
		}
	}, [depKey, config])

	return { error, setError }
}
