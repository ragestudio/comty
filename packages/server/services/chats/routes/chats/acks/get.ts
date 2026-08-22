import type API from "@services/chats/chats.service"
import ChannelAcksModel from "@db/channel_acks"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const user_id = req.auth?.session?.user_id

		if (!user_id) {
			return []
		}

		return await ChannelAcksModel.find({ user_id }, { raw: true })
	},
})
