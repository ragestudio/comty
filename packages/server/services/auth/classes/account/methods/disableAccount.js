import { User } from "@db_models"

export default async (payload) => {
    const { user_id } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    let user = await User.findOne({
        _id: user_id,
    }).select("+email")

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    user = await User.findOneAndUpdate(
        {
            _id: user._id.toString(),
        },
        {
            disabled: true
        },
    )

    return user.toObject()
}