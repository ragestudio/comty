import BotToken from "../../classes/BotToken"

export default async (req, res) => {
	function reject(data) {
		return res.status(401).json(data)
	}

	try {
		const tokenAuthHeader = req.headers?.authorization?.split(" ")

		if (
			tokenAuthHeader[0] === "Bot" &&
			typeof tokenAuthHeader[1] === "string"
		) {
			const validation = await BotToken.validate(tokenAuthHeader[1])

			if (!validation.valid) {
				return reject(validation)
			}

			req.auth = {
				bot: true,
				token: tokenAuthHeader[1],
				user_id: validation.data.user_id.toString(),
				session: {
					__bot_key: true,
					bot_id: validation.data._id.toString(),
					user_id: validation.data.user_id.toString(),
					created_at: validation.data.created_at,
				},
				owner: validation.owner,
				user: validation.user,
			}

			req.user_id = validation.data.user_id.toString()
		}
	} catch (error) {
		console.error(error)

		return res.status(500).json({
			error: "An error occurred meanwhile authenticating your token",
		})
	}
}
