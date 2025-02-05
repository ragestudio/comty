import { Track, User } from "@db_models"
import pMap from "p-map"

const escapeRegex = (str) => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escapa caracteres especiales
}

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		let { keywords, limit = 50, offset = 0 } = req.query

		if (typeof keywords === "undefined") {
			throw new OperationError(400, "Keywords are required")
		}

		let results = {}

		keywords = escapeRegex(keywords)

		const collections = [
			{
				key: "users",
				model: User,
				query: () => {
					return {
						$or: [
							{ username: new RegExp(keywords, "i") },
							{ public_name: new RegExp(keywords, "i") },
						],
					}
				},
			},
			{
				key: "tracks",
				model: Track,
				query: () => {
					return {
						$or: [{ title: new RegExp(keywords, "i") }],
					}
				},
			},
		]

		let searchers = collections.map((collection) => {
			return async () => {
				if (!collection.key) {
					return null
				}

				results[collection.key] = {
					items: [],
				}

				const query = collection.query()

				const totalItems = await collection.model.countDocuments(query)

				let result = await collection.model
					.find(query)
					.limit(limit)
					.skip(offset)
					.sort({ _id: -1 })
					.lean()

				results[collection.key].items = result
				results[collection.key].total_items = totalItems

				return result
			}
		})

		await pMap(
			searchers,
			async (searcher) => {
				return await searcher()
			},
			{
				concurrency: 3,
			},
		)

		return results
	},
}
