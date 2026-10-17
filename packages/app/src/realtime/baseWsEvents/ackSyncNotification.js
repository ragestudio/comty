export default async function (data) {
	const unread = await app.cores.notifications.unread()
	
	for (const notif of unread) {
		if (notif.reference_id === data.reference_id) {
			await app.cores.notifications.ack(notif.id)
		}
	}

	if (!app.cores.notifications.state.acks) {
		app.cores.notifications.state.acks = []
	}

	const acks = app.cores.notifications.state.acks
	const idx = acks.findIndex(a => a.reference_id === data.reference_id)
	if (idx !== -1) {
		acks[idx].last_read_message_id = data.message_id
	} else {
		acks.push({ reference_id: data.reference_id, last_read_message_id: data.message_id })
	}

	app.eventBus.emit("acks:updated", acks)
}
