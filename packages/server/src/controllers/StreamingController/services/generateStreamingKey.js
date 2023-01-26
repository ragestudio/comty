import { nanoid } from "nanoid"

import { StreamingKey, User } from "@models"

export default async (user_id) => {
    // this will generate a new key for the user
    // if the user already has a key, it will be regenerated

    // get username from user_id
    const userData = await User.findById(user_id)

    const streamingKey = new StreamingKey({
        user_id,
        username: userData.username,
        key: nanoid()
    })

    await streamingKey.save()

    return streamingKey
}