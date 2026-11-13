import type API from "@services/users/users.service"

import UserClass from "@classes/users"
import User from "@db_models/user"

const AllowedPublicUpdateFields = [
	"public_name",
	"avatar",
	"email",
	"cover",
	"description",
	"location",
	"links",
	"birthday",
]

const MaxStringsLengths: Record<string, number> = {
	public_name: 120,
	email: 320,
	description: 320,
}

type RouteBody = {
	public_name?: string
	avatar?: string
	email?: string
	cover?: string
	description?: string
	location?: string
	links?: unknown
	birthday?: unknown
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const body = (req.body ?? {}) as RouteBody

		const update: Record<string, any> = {}

		// sanitize update
		AllowedPublicUpdateFields.forEach((key) => {
			const value = (body as Record<string, any>)[key]

			if (typeof value !== "undefined") {
				// check maximung strings length
				if (typeof value === "string" && MaxStringsLengths[key]) {
					if (value.length > MaxStringsLengths[key]) {
						// create a substring
						update[key] = value.substring(0, MaxStringsLengths[key])
					} else {
						update[key] = value
					}
				} else {
					update[key] = value
				}
			}
		})

		if (typeof update.email !== "undefined") {
			const user = await User.findOne({
				email: update.email,
			}).catch((err) => {
				return false
			})

			if (user) {
				throw new OperationError(400, "Email is already in use")
			}
		}

		return await UserClass.update(req.auth.session.user_id, update)
	},
})
