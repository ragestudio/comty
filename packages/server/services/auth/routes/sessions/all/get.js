import Session from "@classes/session"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Session.getAllByUserId(req.auth.session.user_id)
	},
}
