import Groups from "@shared-classes/Spaces/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		if (!Array.isArray(req.body)) {
			throw new OperationError(
				400,
				"Body must be a Array of strings `Array[<string>]`",
			)
		}

		return await Groups.sort(req.auth.session.user_id, req.body)
	},
}
