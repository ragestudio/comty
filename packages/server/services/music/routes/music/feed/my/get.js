export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const { keywords, limit = 10, offset = 0 } = req.query

		const user_id = req.auth.session.user_id

		let total_length = 0
		let result = []

		return {
			total_length: total_length,
			items: result,
		}
	},
}
