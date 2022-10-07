import { User } from "../../models"
import Avatars from "dicebar_lib"
import bcrypt from "bcrypt"

export default async function (payload) {
    let { username, password, email, fullName, roles, avatar } = payload

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
        avatar: avatar ?? Avatars.generate({ seed: username, type: "initials" }).uri,
        roles: roles,
        createdAt: new Date().getTime(),
    })

    await user.save()

    return user
}