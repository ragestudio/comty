export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		return req.auth.session
	},
}
