import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"

type RouteParams = {
	id: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { id } = req.params as RouteParams

		let tag: any = await NFCTag.findOne({
			_id: id,
		})

		if (!tag) {
			return res.status(404).json({
				error: "Cannot find tag",
			})
		}

		tag = tag.toObject()

		if (tag.user_id.toString() !== req.auth.session.user_id) {
			throw new OperationError(403, "You do not own this tag")
		}

		await NFCTag.deleteOne({
			_id: tag._id.toString(),
		})

		return tag
	},
})
