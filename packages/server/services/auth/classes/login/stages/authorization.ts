import { LoginStage, LoginContext } from "../processor"
import Session from "@classes/session"

export default class AuthorizationStage extends LoginStage {
	async execute(context: LoginContext): Promise<void> {
		const { user, request } = context
		const user_id = user._id.toString()

		// 1. Create session
		const session = await Session.create({
			user_id: user_id,
			username: user.username,
			flags: user.flags,
			ip_address:
				request.headers["cf-connecting-ip"] ??
				request.headers["x-forwarded-for"] ??
				request.socket?.remoteAddress ??
				request.ip,
			client: request.headers["user-agent"],
		})

		// 2. Notify new login (background job)
		try {
			global.queues.createJob("notify-new-login", {
				authData: session.data,
				minDate: new Date().getTime() - 3 * 30 * 24 * 60 * 60 * 1000,
			})
		} catch (error) {
			console.error("Failed to create notify-new-login job:", error)
		}

		// 3. Set result
		context.result = {
			user_id: user_id,
			token: session.authToken,
			refreshToken: session.refreshToken,
			expiresIn: session.expiresIn,
		}
		context.isFinished = true
	}
}
