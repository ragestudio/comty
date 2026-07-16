import type API from "@services/auth/auth.service"
//@ts-ignore
import { OidcApp } from "@db_models"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const { clientId } = req.params

		const client = await OidcApp.findOne({ client_id: clientId }).lean()

		if (!client) {
			throw new OperationError(404, "client not found")
		}

		return client
	},
})
