import type API from "@services/main/main.service"
import User from "@db_models/user"
import Config from "@db_models/config"

type RouteParams = {
	flag_id: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req, res, ctx) => {
		const { flag_id } = req.params as RouteParams

		const flags_config = await Config.findOne({ key: "flags" })

		if (!flags_config || !Array.isArray(flags_config.value)) {
			throw new OperationError(400, "Server has not configured flags")
		}

		if (!flags_config.value.includes(flag_id)) {
			throw new OperationError(400, "Flag not valid")
		}

		const user = await User.findById(req.auth.user_id)

		if (!Array.isArray(user.flags)) {
			user.flags = Array()
		}

		if (!user.flags.includes(flag_id)) {
			user.flags.push(flag_id)
			await user.save()
		}

		return {
			ok: true,
			flags: user.flags,
		}
	},
})
