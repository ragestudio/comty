import withAuthentication, {
	type WithAuthenticationReq,
} from "../withAuthentication"

export type WithOptionalAuthenticationReq = {
	auth?: WithAuthenticationReq["auth"]
	user_id?: string
}

export default defineMiddleware()({
	injectReq: {} as WithOptionalAuthenticationReq,
	fn: async (req, res, next) => {
		if (req.headers?.authorization) {
			await withAuthentication.fn(req as any, res, next)
		} else {
			next()
		}
	},
})
