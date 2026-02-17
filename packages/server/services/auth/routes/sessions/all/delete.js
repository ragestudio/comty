import Session from "@classes/session"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Session.deleteAllByUserId(req.auth.session.user_id)
	},
}
