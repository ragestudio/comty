import { User } from "@shared-classes/DbModels"
import bcrypt from "bcrypt"

import requiredFields from "@shared-utils/requiredFields"

export default async (req) => {
    requiredFields(["username", "password", "email"], req.body)

    let { username, password, email, fullName, roles, avatar, acceptTos } = req.body

    if (ToBoolean(acceptTos) !== true) {
        throw new OperationError(400, "You must accept the terms of service in order to create an account.")
    }

    if (username.length < 3) {
        throw new OperationError(400, "Username must be at least 3 characters")
    }

    if (username.length > 64) {
        throw new OperationError(400, "Username cannot be longer than 64 characters")
    }

    // if username has capital letters, throw error
    if (username !== username.toLowerCase()) {
        throw new OperationError(400, "Username must be lowercase")
    }

    // make sure the username has no spaces
    if (username.includes(" ")) {
        throw new OperationError(400, "Username cannot contain spaces")
    }

    // make sure the username has no valid characters. Only letters, numbers, and underscores
    if (!/^[a-z0-9_]+$/.test(username)) {
        throw new OperationError(400, "Username can only contain letters, numbers, and underscores")
    }

    // check if username is already taken
    const existentUser = await User.findOne({ username: username })

    if (existentUser) {
        throw new OperationError(400, "User already exists")
    }

    // check if the email is already in use
    const existentEmail = await User.findOne({ email: email })

    if (existentEmail) {
        throw new OperationError(400, "Email already in use")
    }

    // hash the password
    const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

    let user = new User({
        username: username,
        password: hash,
        email: email,
        fullName: fullName,
        avatar: avatar ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`,
        roles: roles,
        createdAt: new Date().getTime(),
        acceptTos: acceptTos,
    })

    await user.save()

    // TODO: dispatch event bus
    //global.eventBus.emit("user.create", user)

    return user
}