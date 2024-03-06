import { User } from "@db_models"

export default async (payload) => {
    if (typeof payload.user_id === "undefined") {
        throw new Error("No user_id provided")
    }
    if (typeof payload.update === "undefined") {
        throw new Error("No update provided")
    }

    let user = await User.findById(payload.user_id)

    if (!user) {
        throw new Error("User not found")
    }

    const updateKeys = Object.keys(payload.update)

    updateKeys.forEach((key) => {
        user[key] = payload.update[key]
    })

    await user.save()

    global.engine.ws.io.of("/").emit(`user.update`, {
        ...user.toObject(),
    })
    global.engine.ws.io.of("/").emit(`user.update.${payload.user_id}`, {
        ...user.toObject(),
    })

    return user.toObject()
}