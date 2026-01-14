import Groups from "@shared-classes/Spaces/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Groups.create({
			...req.body,
			owner_user_id: req.auth.user_id,
		})
	},
}
