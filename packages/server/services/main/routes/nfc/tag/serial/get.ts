import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"
import User from "@db_models/user"

type RouteParams = {
	serial: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		const { serial } = req.params as RouteParams

		let tag: any = await NFCTag.findOne({
			serial: serial,
		})

		if (!tag) {
			return res.status(404).json({
				error: "Cannot find tag",
			})
		}

		tag = tag.toObject()

		if ((req as any).user) {
			if (tag.user_id.toString() === req.auth?.session?.user_id) {
				tag.is_owner = true
			}
		}

		tag.user = await User.findOne({
			_id: tag.user_id,
		})

		return tag
	},
})
