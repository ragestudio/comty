import { User } from "@db_models"

export default async (payload = {}) => {
    const { user_id, from_user_id } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    const user = await User.findOne({
        _id: user_id,
    }).catch((err) => {
        return false
    })

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    return user
}