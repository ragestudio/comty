import React from "react"

const useAckNotifications = () => {
	const [pending, setPending] = React.useState([])

	const load = async () => {
		setPending(await app.cores.notifications.unread())
	}

	const handleNewAck = (notification) => {
		load()
	}

	React.useEffect(() => {
		load()

		app.eventBus.on("notification:ack:new", handleNewAck)
		app.eventBus.on("notification:ack:del", handleNewAck)

		return () => {
			app.eventBus.off("notification:ack:new", handleNewAck)
			app.eventBus.off("notification:ack:del", handleNewAck)
		}
	}, [])

	return {
		pending,
		setPending,
	}
}

export default useAckNotifications
