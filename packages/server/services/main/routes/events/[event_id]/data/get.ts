import type API from "@services/main/main.service"
import Event from "@db_models/event"

type RouteParams = {
	event_id: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { event_id } = req.params as RouteParams

		let event: any = await Event.findById(event_id)

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
	},
})
