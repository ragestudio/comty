import handleUpgrade from "./handlers/handleUpgrade"

function getToken(req) {
	const queryToken = req.getQuery("token")
	const headerToken = req.getHeader("authorization")

	let token = `Bearer ${queryToken}`

	if (headerToken) {
		token = headerToken
	}

	return token
}

export default async function (res, req, context) {
	const abortController = new AbortController()

	res.onAborted(() => {
		abortController.abort()
	})

	const ctx = {
		socket_id: nanoid(),
		token: getToken(req),
	}

	const wsKey = req.getHeader("sec-websocket-key")
	const wsProto = req.getHeader("sec-websocket-protocol")
	const wsExt = req.getHeader("sec-websocket-extensions")

	const data = await handleUpgrade.bind(this)(res, res, ctx)

	if (abortController.signal.aborted) {
		return null
	}

	res.cork(() => {
		if (abortController.signal.aborted) {
			return null
		}

		res.upgrade(
			{
				...ctx,
				...data,
			},
			wsKey,
			wsProto,
			wsExt,
			context,
		)
	})
}
