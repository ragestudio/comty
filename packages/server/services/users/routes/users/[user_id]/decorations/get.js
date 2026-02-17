import { User, Decorations } from "@db_models"

export default {
	fn: async (req) => {
		const { user_id } = req.params

		const user = await User.findById(user_id).lean()

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		if (!user.decorations) {
			return {}
		}

		const decorationsIds = Object.values(user.decorations)

		if (decorationsIds.length === 0) {
			return {}
		}

		let decorationsData = await Decorations.find({
			_id: { $in: decorationsIds },
		}).lean()

		decorationsData = new Map(
			decorationsData.map((decoration) => [
				decoration._id.toString(),
				decoration,
			]),
		)

		for (const [decorationKey, decorationId] of Object.entries(
			user.decorations,
		)) {
			user.decorations[decorationKey] = decorationsData.get(decorationId)
		}

		return user.decorations
	},
}
