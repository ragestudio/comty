import { NFCTag } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		let tag = await NFCTag.findOne({
			_id: req.params.id,
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
}
