export default {
    useContext: ["mailTransporter"],
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        req.body = await req.urlencoded()

        const { to, subject, body } = req.body

        const mailOptions = {
            from: "comty_no_reply@ragestudio.net",
            to: to,
            subject: subject,
            text: body
        }

        console.log(mailOptions)

        console.log(`Sending email to ${to}...`)

        const result = await this.default.contexts.mailTransporter.sendMail(mailOptions)

        console.log("Email sent! >", result)

        return res.json({
            code: 0,
            message: "ok",
            result: result
        })
    }
}