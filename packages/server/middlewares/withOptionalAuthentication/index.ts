import withAuthentication, {
	type WithAuthenticationReq,
} from "../withAuthentication"

export default defineMiddleware<WithAuthenticationReq>()(async (
	req,
	res,
	next,
) => {
	if (req.headers?.authorization) {
		await withAuthentication.fn(req, res, next)
	} else {
		next()
	}
})
