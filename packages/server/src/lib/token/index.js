import jwt from "jsonwebtoken"
import { nanoid } from "nanoid"
import { Session, User } from "../../models"

export async function createNewAuthToken(user, options = {}) {
    const payload = {
        user_id: user._id,
        username: user.username,
        email: user.email,
        refreshToken: nanoid(),
        signLocation: global.signLocation,
    }

    await User.findByIdAndUpdate(user._id, { refreshToken: payload.refreshToken })

    return await signNew(payload, options)
}

export async function signNew(payload, options = {}) {
    if (options.updateSession) {
        const sessionData = await Session.findById(options.updateSession)
        payload.session_uuid = sessionData.session_uuid
    } else {
        payload.session_uuid = nanoid()
    }

    const token = jwt.sign(payload, options.secretOrKey, {
        expiresIn: options.expiresIn ?? "1h",
        algorithm: options.algorithm ?? "HS256"
    })

    const session = {
        token: token,
        session_uuid: payload.session_uuid,
        username: payload.username,
        user_id: payload.user_id,
        date: new Date().getTime(),
        location: payload.signLocation ?? "rs-auth",
    }

    if (options.updateSession) {
        await Session.findByIdAndUpdate(options.updateSession, {
            token: session.token,
            date: session.date,
            location: session.location,
        })
    } else {
        let newSession = new Session(session)

        newSession.save()
    }

    return token
}