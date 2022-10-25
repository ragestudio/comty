import bcrypt from "bcrypt"
import { User } from "../../../models"

export default async function (payload) {
    const { user_id, password } = payload

    if (!user_id) {
        throw new Error("Missing user_id")
    }

    if (!password) {
        throw new Error("Missing password")
    }

    const user = await User.findById(user_id)

    if (!user) {
        throw new Error("User not found")
    }

    // hash the password
    const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

    user.password = hash

    await user.save()

    return {
        status: "ok",
        message: "Password updated successfully",
    }
}