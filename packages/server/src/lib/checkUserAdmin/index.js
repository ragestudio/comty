import { User } from "../../models"

export default async (user_id) => {
    if (!user_id) {
        throw new Error("Missing user id")
    }

    const user = await User.findById(user_id)

    if (!user) {
        throw new Error("User not found")
    }

    if (!user.roles.includes("admin")) {
        return false
    }

    return true
}