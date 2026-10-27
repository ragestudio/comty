import client from "comty.js/core/client"

export default class ActivityEvent {
	constructor(id, payload) {
		if (typeof id !== "string") {
			console.error("Event id is required")
			return
		}

		this.id = id
		this.payload = payload

		this.send()
	}

	send = async () => {
		return await client.instance({
			url: "/activity/client",
			method: "POST",
			data: {
				id: this.id,
				payload: this.payload,
			},
		})
	}
}
