import { Group } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const user_id = req.auth.session.user_id

		let group = new Group({
			name: req.body.name,
			description: req.body.description,
			owner_user_id: user_id,
			members: [
				{
					user_id: user_id,
					joined_at: Date.now(),
				},
			],
		})

		await group.save()

		return group
	},
}
