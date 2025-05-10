import Radio from "@classes/radio"

export default async (req) => {
	const { limit = 50, offset = 0 } = req.query

	let result = await Radio.list({
		limit: limit,
		offset: offset,
	})

	return result
}
