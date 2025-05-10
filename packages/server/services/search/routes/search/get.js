import pMap from "p-map"

import UsersCollector from "../../collectors/users"
import TracksCollector from "../../collectors/tracks"
import ExtensionsCollector from "../../collectors/extensions"

const escapeRegex = (str) => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escapa caracteres especiales
}

const collectors = {
	users: UsersCollector,
	tracks: TracksCollector,
	extensions: ExtensionsCollector,
}

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		let {
			keywords = "",
			limit = 50,
			offset = 0,
			fields = "users,tracks",
		} = req.query

		if (typeof keywords === "undefined") {
			throw new OperationError(400, "Keywords are required")
		}

		fields = fields.split(",").map((field) => field.trim())

		let results = {}

		keywords = escapeRegex(keywords)

		const collections = []

		fields.forEach((field) => {
			if (collectors[field]) {
				collections.push(collectors[field])
			}
		})

		let searchers = collections.map((collection) => {
			return async () => {
				if (!collection.key) {
					return null
				}

				results[collection.key] = {
					items: [],
				}

				const query = collection.query(keywords)

				const totalItems = await collection.model.countDocuments(query)

				if (typeof collection.aggregation === "function") {
					const aggregation = await collection.model.aggregate(
						collection.aggregation(keywords),
					)

					results[collection.key].items = aggregation
					results[collection.key].total_items = aggregation.length

					return aggregation
				}

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
