import templates from "../templates"

export default async (ctx, data) => {
    const { user_id, username, email, apr_link, created_at, expires_at, ip_address, client } = data

    if (!user_id || !username || !email || !apr_link || !created_at || !expires_at || !ip_address || !client) {
        throw new OperationError(400, "Bad request")
    }

    const result = await ctx.mailTransporter.sendMail({
        from: process.env.SMTP_USERNAME,
        to: email,
        subject: "Password reset",
        html: templates.password_recovery({
            username: username,

            apr_link: apr_link,

            date: new Date(created_at),
            ip: ip_address,
            client: client,
        }),
    })

    return result
}
