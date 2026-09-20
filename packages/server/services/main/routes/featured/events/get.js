import Event from "@db_models/event"

export default async (req) => {
	const events = await Event.find({
		endDate: { $gte: new Date() },
		featured: true,
	})

	return events
}
