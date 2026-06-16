import type API from "@services/auth/auth.service"
import Session from "@classes/session"
import LoginPipeline from "@classes/login"

export default defineRoute<API>()({
	fn: async (req, res) => {
		if (req.body.refreshToken && req.body.authToken) {
			return await Session.handleRefresh(req, res)
		}

		return await LoginPipeline(req)
	},
})
