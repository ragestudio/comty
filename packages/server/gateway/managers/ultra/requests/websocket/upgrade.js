export default function (res, req, context) {
	const queryToken = req.getQuery("token")
	const headerToken = req.getHeader("authorization")

	let token = queryToken

	if (headerToken && headerToken !== "") {
		token = headerToken
	}

	res.upgrade(
		{
			token: token,
		},
		req.getHeader("sec-websocket-key"),
		req.getHeader("sec-websocket-protocol"),
		req.getHeader("sec-websocket-extensions"),
		context,
	)
}
