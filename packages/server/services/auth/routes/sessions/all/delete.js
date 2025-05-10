import { Session } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		let sessions = await Session.find({
			user_id: req.auth.session.user_id,
		})

		sessions = sessions.map((session) => {
			return session._id.toString()
		})

		await Session.deleteMany({
			_id: sessions,
		})

		return {
			ok: true,
			sessions: sessions,
		}
	},
}
