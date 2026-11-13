import type API from "@services/users/users.service"

import User from "@db_models/user"
import Decorations from "@db_models/decorations"

type RouteParams = {
	user_id: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const isMultiple = user_id.includes(",")
		const ids = isMultiple ? user_id.split(",") : [user_id]

		const users = await User.find(
			{ _id: { $in: ids } },
			"decorations",
		).lean()

		if (!isMultiple && !users.length) {
			throw new OperationError(404, "User not found")
		}

		const decoIds = [
			...new Set(
				users.flatMap((user) =>
					Object.values(user.decorations || {}).map(String),
				),
			),
		]

		const decos = decoIds.length
			? await Decorations.find({
					_id: { $in: decoIds },
					enabled: { $ne: false },
				}).lean()
			: []

		const decoDict = Object.fromEntries(
			decos.map((decoration) => [String(decoration._id), decoration]),
		)
		const userDict = Object.fromEntries(
			users.map((user) => [String(user._id), user]),
		)

		const result = ids.map((id) => {
			const hydrated: Record<string, any> = {}
			const userDecos = userDict[id]?.decorations || {}

			for (const key in userDecos) {
				const decoration = decoDict[String(userDecos[key])]

				if (decoration) {
					hydrated[key] = decoration
				}
			}

			return isMultiple
				? { user_id: id, decorations: hydrated }
				: hydrated
		})

		return isMultiple ? result : result[0]
	},
})
