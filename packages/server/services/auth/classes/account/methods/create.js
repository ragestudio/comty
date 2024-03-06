import bcrypt from "bcrypt"
import { User } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"
import Account from "@classes/account"

export default async (payload) => {
    requiredFields(["username", "password", "email"], payload)

    let { username, password, email, fullName, roles, avatar, acceptTos } = payload

    if (ToBoolean(acceptTos) !== true) {
        throw new OperationError(400, "You must accept the terms of service in order to create an account.")
    }

    await Account.usernameMeetPolicy(username)

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

    await Account.passwordMeetPolicy(password)

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