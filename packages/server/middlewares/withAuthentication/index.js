import AuthToken from "../../classes/AuthToken"
import ServerToken from "../../classes/ServerToken"
import BotToken from "../../classes/BotToken"

export default async (req, res) => {
	function reject(data) {
		return res.status(401).json(data)
	}

	try {
		const tokenAuthHeader = req.headers?.authorization?.split(" ")

		if (!tokenAuthHeader) {
			return reject({
				error: "Missing token header",
			})
		}

		if (!tokenAuthHeader[1]) {
			return reject({
				error: "Received header, missing token",
			})
		}

		switch (tokenAuthHeader[0]) {
			case "Bearer": {
				const token = tokenAuthHeader[1]

				const validation = await AuthToken.validate(token)

				if (!validation.valid) {
					return reject(validation)
				}

				req.auth = {
					token: token,
					user_id: validation.session.user_id,
					decoded: validation.data,
					session: validation.session,
					user: validation.user,
				}

				req.user_id = validation.session.user_id

				return
			}
			case "Server": {
				const [access_id, secret_token] = tokenAuthHeader[1].split(":")

				const validation = await ServerToken.validate(
					access_id,
					secret_token,
				)

				if (!validation.valid) {
					return reject(validation)
				}

				req.auth = {
					server: true,
					token: tokenAuthHeader[1],
					user_id: validation.data.owner_user_id,
					session: {
						__server_key: true,
						user_id: validation.data.owner_user_id,
						created_at: validation.data.created_at,
					},
					user: validation.user,
				}

				req.user_id = validation.data.owner_user_id

				return
			}
			case "Bot": {
				if (!req.auth) {
					return reject({
						error: "Invalid authentication method",
					})
				}

				return
			}
			default: {
				return reject({
					error: "Invalid token type",
				})
			}
		}
	} catch (error) {
		console.error(error)

		return res.status(500).json({
			error: "An error occurred meanwhile authenticating your token",
		})
	}
}
