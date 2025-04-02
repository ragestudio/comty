export default class ActivityEvent {
	constructor(id, payload) {
		if (typeof id !== "string") {
			console.error("Event id is required")
			return false
		}

		this.id = id
		this.payload = payload

		this.send().catch((err) => {
			console.error("Failed to send remote event >", err)
		})
	}

	send = async () => {
		app.cores.api.customRequest({
			url: "/activity/client",
			method: "POST",
			data: {
				id: this.id,
				payload: this.payload,
			},
		})
	}
}
