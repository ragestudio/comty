import Decorations from "@db_models/decorations"

export default async (req) => {
	const { type, slot } = req.query

	const query = {
		enabled: { $ne: false },
	}

	const slotType = type ?? slot

	if (slotType) {
		query.type = slotType
	}

	return await Decorations.find(query).sort({ name: 1 }).lean()
}
