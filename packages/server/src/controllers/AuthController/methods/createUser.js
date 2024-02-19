import { User } from "@shared-classes/DbModels"
import bcrypt from "bcrypt"

export default async function (payload) {
    let { username, password, email, fullName, roles, avatar } = payload

    if (username.length < 3) {
        throw new Error("Username must be at least 3 characters")
    }

    if (username.length > 64) {
        throw new Error("Username cannot be longer than 64 characters")
    }

    // if username has capital letters, throw error
    if (username !== username.toLowerCase()) {
        throw new Error("Username must be lowercase")
    }

    // make sure the username has no spaces
    if (username.includes(" ")) {
        throw new Error("Username cannot contain spaces")
    }

    // make sure the username has no valid characters. Only letters, numbers, and underscores
    if (!/^[a-z0-9_]+$/.test(username)) {
        throw new Error("Username can only contain letters, numbers, and underscores")
    }

    // check if username is already taken
    const existentUser = await User.findOne({ username: username })

    if (existentUser) {
        throw new Error("User already exists")
    }

    // check if the email is already in use
    const existentEmail = await User.findOne({ email: email })

    if (existentEmail) {
        throw new Error("Email already in use")
    }

    // hash the password
    const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

    // create the doc
    let user = new User({
        username: username,
        password: hash,
        email: email,
        fullName: fullName,
        avatar: avatar ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`,
        roles: roles,
        createdAt: new Date().getTime(),
    })

    await user.save()

    // dispatch event bus
    global.eventBus.emit("user.create", user)

    return user
}