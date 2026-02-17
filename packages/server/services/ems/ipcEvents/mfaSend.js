// TODO: Support SMS 2fa
import { User } from "@db_models"
import templates from "../templates"

export default async (ctx, data) => {
	const user = await User.findById(data.user_id).select("+email")

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	//console.log(`Sending MFA code to ${user.email}...`, data)

	const result = await ctx.mailTransporter.sendMail({
		from: process.env.SMTP_USERNAME,
		to: user.email,
		subject: "Verification code",
		html: templates.mfa_code({
			code: data.code,
			username: user.username,
			date: new Date(data.created_at),
			expires_at: new Date(data.expires_at),
			ip: data.ip_address,
			client: data.client,
		}),
	})

	return result
}
