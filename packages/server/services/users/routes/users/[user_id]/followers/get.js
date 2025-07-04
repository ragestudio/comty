import User from "@classes/users"

export default {
	fn: async (req) => {
		return await User.getFollowers({
			user_id: req.params.user_id,
			data: ToBoolean(req.query.fetchData),
			limit: parseInt(req.query.limit),
			page: parseInt(req.query.page),
		})
	},
}
