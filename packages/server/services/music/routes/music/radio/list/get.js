import { RadioProfile } from "@db_models"

async function scanKeysWithPagination(pattern, count = 10, cursor = "0") {
	const result = await global.websocket.redis.scan(
		cursor,
		"MATCH",
		pattern,
		"COUNT",
		count,
	)

	return result[1]
}

async function getHashData(hashKey) {
	const hashData = await global.websocket.redis.hgetall(hashKey)
	return hashData
}

export default async (req) => {
	const { limit = 50, offset = 0 } = req.query

	let result = await scanKeysWithPagination(`radio-*`, limit, String(offset))

	const radioIds = result.map((key) => key.split("radio-")[1])

	const radioProfiles = await RadioProfile.find({
		_id: { $in: radioIds },
	})

	result = await Promise.all(
		result.map(async (key) => {
			let data = await getHashData(key)

			const profile = radioProfiles
				.find((profile) => profile._id.toString() === data.radio_id)
				.toObject()

			data.now_playing = JSON.parse(data.now_playing)
			data.online = ToBoolean(data.online)

			return { ...data, ...profile }
		}),
	)

	return result
}
