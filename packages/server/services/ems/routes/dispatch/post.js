import templates from "../../templates"

export default {
	useContext: ["mailTransporter"],
	middlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req, res) => {
		req.body = await req.urlencoded()

		let { to, subject, body, template } = req.body

		if (template) {
			if (!templates[template]) {
				throw new OperationError(404, "Template not found")
			}

			body = templates[template]({
				...req.body,
			})
		}

		const mailOptions = {
			from: process.env.SMTP_USERNAME,
			to: to,
			subject: subject,
			html: body,
		}

		console.log(mailOptions)

		console.log(`Sending email to ${to}...`)

		const result =
			await this.default.contexts.mailTransporter.sendMail(mailOptions)

		console.log("Email sent! >", result)

		return res.json({
			code: 0,
			message: "ok",
			result: result,
		})
	},
}
