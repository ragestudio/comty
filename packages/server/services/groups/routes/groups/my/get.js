import Groups from "@shared-classes/Spaces/Groups"

export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		// TODO: implement pagination
		//const { limit, offset } = req.query

		let groups = await Groups.getManyByJoinedUserId(
			req.auth.session.user_id,
		)

		const sorted = await Groups.sortModel
			.findOne(
				{
					user_id: req.auth.session.user_id,
				},
				{
					raw: true,
				},
			)
			.catch(() => null)

		if (sorted) {
			if (Array.isArray(sorted.order)) {
				groups = groups.sort((a, b) => {
					return (
						sorted.order.indexOf(a._id) -
						sorted.order.indexOf(b._id)
					)
				})
			}
		}

		return {
			items: groups,
		}
	},
}
