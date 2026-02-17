import { Decorations } from "@db_models"

export default async (req) => {
	let { ids } = req.params

	ids = ids.split(",")

	return await Decorations.find({ _id: { $in: ids } })
}
