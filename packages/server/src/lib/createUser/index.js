import { User } from "../../models"
import Avatars from "dicebar_lib"
import bcrypt from "bcrypt"

export default async function (payload) {
    let { username, password, email, fullName, roles, avatar } = payload

    const existentUser = await User.findOne({ username: username })

    if (existentUser) {
        throw new Error("User already exists")
    }

    const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

    let user = new User({
        username: username,
        password: hash,
        email: email,
        fullName: fullName,
        avatar: avatar ?? Avatars.generate({ seed: username, type: "initials" }).uri,
        roles: roles,
    })

    user.save()

    return user
}