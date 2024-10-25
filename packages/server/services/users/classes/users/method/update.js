import { User } from "@db_models"

export default async (user_id, update) => {
    if (typeof user_id === "undefined") {
        throw new Error("No user_id provided")
    }

    if (typeof update === "undefined") {
        throw new Error("No update provided")
    }

    let user = await User.findById(user_id)

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    const updateKeys = Object.keys(update)

    updateKeys.forEach((key) => {
        user[key] = update[key]
    })

    await user.save()

    user = user.toObject()

    //global.websocket.io.of("/").emit(`user.update.${update}`, user)

    return user
}