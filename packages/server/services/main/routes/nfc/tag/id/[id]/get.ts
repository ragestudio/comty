import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"
import User from "@db_models/user"

type RouteParams = {
	id: string
}

export default defineRoute<API>()({
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

		if ((req as any).user) {
			if (tag.user_id.toString() === (req as any).auth.session.user_id) {
				tag.is_owner = true
			}
		}

		tag.user = await User.findOne({
			_id: tag.user_id,
		})

		return tag
	},
})
