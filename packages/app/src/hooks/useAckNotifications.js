import React from "react"

const useAckNotifications = () => {
	const [pending, setPending] = React.useState([])
	const [acks, setAcks] = React.useState(app.cores.notifications.state.acks || [])

	const load = async () => {
		setPending(await app.cores.notifications.unread())
	}

	const handleNewAck = (notification) => {
		load()
	}

	const handleAcksUpdated = (newAcks) => {
		setAcks([...newAcks])
	}

	React.useEffect(() => {
		load()
		if (app.cores.notifications.state.acks) {
			setAcks([...app.cores.notifications.state.acks])
		}

		app.eventBus.on("notification:ack:new", handleNewAck)
		app.eventBus.on("notification:ack:del", handleNewAck)
		app.eventBus.on("acks:updated", handleAcksUpdated)

		return () => {
			app.eventBus.off("notification:ack:new", handleNewAck)
			app.eventBus.off("notification:ack:del", handleNewAck)
			app.eventBus.off("acks:updated", handleAcksUpdated)
		}
	}, [])

	return {
		pending,
		setPending,
		acks,
		setAcks,
	}
}

export default useAckNotifications
