import { Extension } from "@db_models"

export default async (req) => {
	const { limit = 10, offset = 0 } = req.query

	const totalItems = await Extension.countDocuments()

	const extensions = await Extension.aggregate([
		{
			$sort: { registryId: 1, version: -1 },
		},
		{
			$group: {
				_id: "$registryId",
				doc: { $first: "$$ROOT" },
			},
		},
		{
			$replaceRoot: { newRoot: "$doc" },
		},
		{
			$skip: parseInt(offset),
		},
		{
			$limit: parseInt(limit),
		},
	])

	return {
		items: extensions,
		total_items: totalItems,
	}
}
