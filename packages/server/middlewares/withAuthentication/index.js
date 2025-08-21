import { ServerKeys } from "../../db_models"
import AuthToken from "../../classes/AuthToken"

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
				error: "Recived header, missing token",
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
					decoded: validation.data,
					session: validation.session,
					user: validation.user,
				}

				return
			}
			case "Server": {
				const [access_id, secret_token] = tokenAuthHeader[1].split(":")

				if (access_id === "undefined" || secret_token === "undefined") {
					return reject({
						error: "Invalid server token",
					})
				}

				const serverTokenEntry = await ServerKeys.findOne({
					access_id,
				})
					.select("+secret_token")
					.catch((err) => {
						return null
					})

				if (!serverTokenEntry) {
					return reject({
						error: "Invalid server token",
					})
				}

				if (serverTokenEntry.secret_token !== secret_token) {
					return reject({
						error: "Missmatching secret_token",
					})
				}

				req.auth = {
					server: true,
					token: tokenAuthHeader,
					decoded: null,
					session: {
						__server_key: true,
						user_id: serverTokenEntry.owner_user_id,
						created_at: serverTokenEntry.created_at,
					},
					user: async () =>
						await User.findOne({
							_id: serverTokenEntry.owner_user_id,
						}),
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
