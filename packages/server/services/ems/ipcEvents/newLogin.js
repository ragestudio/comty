import { User } from "@db_models"
import templates from "../templates"

export default async (ctx, data) => {
    const user = await User.findById(data.user_id).select("+email")

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    const result = await ctx.mailTransporter.sendMail({
        from: process.env.SMTP_USERNAME,
        to: user.email,
        subject: "New login",
        html: templates.new_login({
            date: new Date(data.date),
            ip: data.ip_address,
            client: data.client,
            username: user.username
        }),
    })

    return result
}
