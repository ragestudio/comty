import { Event } from "@db_models"

export default async (req) => {
	let event = await Event.findById(req.params.event_id)

	event = event.toObject()

	// fetch page if exist
	if (event.page && event.page.startsWith("https://")) {
		try {
			const response = await fetch(event.page)
			event.page = await response.text()
		} catch (error) {
			console.error(error)
		}
	}

	return event
}
