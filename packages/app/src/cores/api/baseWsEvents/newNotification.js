export default async function (data) {
	data.ack = true

	if (typeof data.data === "string") {
		try {
			const parsed = JSON.parse(data.data)
			data.description = parsed.short_message || "New message"
			if (parsed.group_id) {
				data.group_id = parsed.group_id
			}
		} catch (e) {}
	}
	
	if (!data.title) {
		if (data.type === "group_mention") {
			data.title = "You were mentioned!"
		} else if (data.type === "dm_message") {
			data.title = "New Direct Message"
		} else {
			data.title = "New Notification"
		}
	}

	return app.cores.notifications.new(data)
}
