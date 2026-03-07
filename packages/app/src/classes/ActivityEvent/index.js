export default class ActivityEvent {
	constructor(id, payload) {
		if (typeof id !== "string") {
			console.error("Event id is required")
			return false
		}

		this.id = id
		this.payload = payload

		this.send()
	}

	send = async () => {
		return await app.cores.api.customRequest({
			url: "/activity/client",
			method: "POST",
			data: {
				id: this.id,
				payload: this.payload,
			},
		})
	}
}
