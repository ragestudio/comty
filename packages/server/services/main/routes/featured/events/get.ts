import type API from "@services/main/main.service"
import Event from "@db_models/event"

export default defineRoute<API>()({
	fn: async () => {
		const events = await Event.find({
			endDate: { $gte: new Date() },
			featured: true,
		})

		return events
	},
})
