import templates from "../templates"

export default async (ctx, data) => {
	const { code, created_at, expires_at, ip_address, client } = data
	const { email, username } = data.user

	console.log(`Sending password recovery email to ${email}`)

	if (
		!username ||
		!email ||
		!code ||
		!created_at ||
		!expires_at ||
		!ip_address ||
		!client
	) {
		throw new OperationError(400, "Bad request")
	}

	const result = await ctx.mailTransporter.sendMail({
		from: process.env.SMTP_USERNAME,
		to: email,
		subject: "Password reset",
		html: templates.password_recovery({
			username: username,
			code: code,
			date: new Date(created_at),
			ip: ip_address,
			client: client,
		}),
	})

	return result
}
