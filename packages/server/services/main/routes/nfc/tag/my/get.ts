import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		let tags = await NFCTag.find({
			user_id: req.auth.session.user_id,
		})

		return tags
	},
})
