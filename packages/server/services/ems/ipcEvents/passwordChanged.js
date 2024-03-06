import { User } from "@db_models"
import templates from "../templates"

export default async (ctx, data) => {
    const user = await User.findById(data.user_id)

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    const result = await ctx.mailTransporter.sendMail({
        from: process.env.SMTP_USERNAME,
        to: user.email,
        subject: "Your password has been changed",
        html: templates.password_changed({
            username: user.username,
            date: new Date(data.date),
            ip: data.ip_address,
            client: data.client,
        }),
    })

    return result
}
