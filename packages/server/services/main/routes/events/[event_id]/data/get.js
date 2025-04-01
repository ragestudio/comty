import { Event } from "@db_models"
import axios from "axios"

export default async (req) => {
	let event = await Event.findById(req.params.event_id)

	event = event.toObject()

	// fetch page if exist
	if (event.page && event.page.startsWith("https://")) {
		try {
			const response = await axios.get(event.page)
			event.page = response.data
		} catch (error) {
			console.error(error)
		}
	}

	return event
}
