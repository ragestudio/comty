import { RadioProfile } from "@db_models"

async function scanKeysWithPagination(pattern, count = 10, cursor = "0") {
	const result = await global.redis.scan(
		cursor,
		"MATCH",
		pattern,
		"COUNT",
		count,
	)

	return result[1]
}

export default class Radio {
	static async list({ limit = 50, offset = 0 } = {}) {
		let result = await scanKeysWithPagination(
			`radio-*`,
			limit,
			String(offset),
		)

		return await Radio.data(result.map((key) => key.split("radio-")[1]))
	}

	static async data(ids) {
		if (typeof ids === "string") {
			ids = [ids]
		}

		const results = []

		let profiles = await RadioProfile.find({
			_id: { $in: ids },
		})

		for await (const id of ids) {
			let data = await redis.hgetall(`radio-${id}`)

			if (!data) {
				continue
			}

			let profile = profiles.find(
				(profile) => profile._id.toString() === id,
			)

			if (!profile) {
				continue
			}

			profile = profile.toObject()

			data.now_playing = JSON.parse(data.now_playing)
			data.online = ToBoolean(data.online)
			data.listeners = parseInt(data.listeners)

			results.push({ ...data, ...profile })
		}

		return results
	}

	static async trendings() {
		const stationsWithListeners = []

		let cursor = "0"

		do {
			const scanResult = await global.redis.scan(
				cursor,
				"MATCH",
				"radio-*",
				"COUNT",
				100,
			)
			cursor = scanResult[0]
			const keys = scanResult[1]

			for (const key of keys) {
				const id = key.split("radio-")[1]
				const listenersStr = await global.redis.hget(key, "listeners")

				if (listenersStr !== null) {
					const listeners = parseInt(listenersStr, 10)
					if (!isNaN(listeners)) {
						stationsWithListeners.push({ id, listeners })
					}
				}
			}
		} while (cursor !== "0")

		// Sort stations by listeners in descending order
		stationsWithListeners.sort((a, b) => b.listeners - a.listeners)

		// Get the IDs of the top 4 stations
		const stationsIds = stationsWithListeners
			.slice(0, 4)
			.map((station) => station.id)

		// If no stations found or no stations with valid listener counts, return an empty array
		if (stationsIds.length === 0) {
			return []
		}

		return await Radio.data(stationsIds)
	}
}
