import User from "@db_models/user"
import Decorations from "@db_models/decorations"

export default {
	fn: async (req) => {
		const { user_id } = req.params
		const isMultiple: boolean = user_id.includes(",")
		const ids: string[] = isMultiple ? user_id.split(",") : [user_id]

		const users = await User.find(
			{ _id: { $in: ids } },
			"decorations",
		).lean()

		if (!isMultiple && !users.length) {
			throw new OperationError(404, "User not found")
		}

		const decoIds = [
			...new Set(
				users.flatMap((u) =>
					Object.values(u.decorations || {}).map(String),
				),
			),
		]

		const decos = decoIds.length
			? await Decorations.find({ _id: { $in: decoIds } }).lean()
			: []

		const decoDict = Object.fromEntries(
			decos.map((dec) => [String(dec._id), dec]),
		)
		const userDict = Object.fromEntries(
			users.map((u) => [String(u._id), u]),
		)

		const result = ids.map((id) => {
			const hydrated = {}
			const userDecos = userDict[id]?.decorations || {}

			for (const key in userDecos) {
				hydrated[key] = decoDict[String(userDecos[key])] || null
			}

			return isMultiple
				? { user_id: id, decorations: hydrated }
				: hydrated
		})

		return isMultiple ? result : result[0]
	},
}
