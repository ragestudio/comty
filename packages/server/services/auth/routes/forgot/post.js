import { User, APRSession } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"

export default async (req) => {
    requiredFields(["email"], req.body)

    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        throw new OperationError(400, "User not found")
    }

    const apr = new APRSession({
        user_id: user._id.toString(),

        created_at: new Date().getTime(),
        expires_at: new Date().getTime() + 60 * 60 * 1000,

        code: nanoid(),

        ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket?.remoteAddress ?? req.ip,
        client: req.headers["user-agent"],

        status: "sended",
    })

    await apr.save()

    await ipc.call("ems", "apr:send", {
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        code: apr.code,
        apr_link: `https://comty.app/forgot/apr/${apr.code}`,

        created_at: apr.created_at,
        expires_at: apr.expires_at,

        client: apr.client,
        ip_address: apr.ip_address,
    })

    return {
        message: `Email sent to ${email}`,
        sent: true,
    }
}