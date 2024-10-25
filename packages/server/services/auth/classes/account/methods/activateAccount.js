import { User, ActivationCode } from "@db_models"

export default async (payload) => {
    const { code, user_id } = payload

    if (!code) {
        throw new OperationError(400, "Missing code")
    }

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    let user = await User.findOne({
        _id: user_id,
    }).select("+email")

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    if (user.activated) {
        throw new OperationError(400, "User already activated")
    }

    let activationCode = await ActivationCode.findOne({
        user_id: user._id.toString(),
        code: code,
    })

    if (!activationCode) {
        throw new OperationError(400, "Invalid activation code")
    }

    user = await User.findOneAndUpdate(
        {
            _id: user._id.toString(),
        },
        {
            activated: true
        },
    )

    await ActivationCode.deleteOne({
        user_id: user._id.toString(),
        code: code,
    })

    return user.toObject()
}