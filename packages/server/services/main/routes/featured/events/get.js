import { Event } from "@db_models"

export default async (req) => {
	const events = await Event.find({
		endDate: { $gte: new Date() },
		featured: true,
	})

	return events
}
