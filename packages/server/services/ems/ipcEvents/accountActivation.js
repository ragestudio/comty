import templates from "../templates"

export default async (ctx, data) => {
	const { user, activation_code } = data

	console.log(`Sending activation code to [${user.email}]`)

	const result = await ctx.mailTransporter.sendMail({
		from: process.env.SMTP_USERNAME,
		to: user.email,
		subject: "Account activation",
		html: templates.account_activation({
			username: user.username,
			code: activation_code,
		}),
	})

	return result
}
