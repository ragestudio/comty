import Session from "@classes/session"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Session.delete(req.auth.session._id)
	},
}
