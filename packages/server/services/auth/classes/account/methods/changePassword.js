import bcrypt from "bcrypt"
import { User, OperationLog } from "@db_models"
import Account from "@classes/account"

export default async ({ user_id, old_hash, old_password, new_password, log_comment }, req) => {
    let user = await User.findById(user_id).select("+password")

    user = await Account.loginStrategy({ password: old_password, hash: old_hash }, user)

    await Account.passwordMeetPolicy(new_password)

    user.password = bcrypt.hashSync(new_password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

    await user.save()

    const operation = {
        type: "password:changed",
        user_id: user._id.toString(),
        date: Date.now(),
        comments: []
    }

    if (log_comment) {
        operation.comments.push(log_comment)
    }

    if (typeof req === "object") {
        operation.ip_address = req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket?.remoteAddress ?? req.ip
        operation.client = req.headers["user-agent"]
    }

    const log = new OperationLog(operation)

    await log.save()

    ipc.invoke("ems", "password:changed", operation)

    return user
}