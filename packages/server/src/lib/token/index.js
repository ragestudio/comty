import jwt from "jsonwebtoken"
import { Session, RegenerationToken } from "@models"

export async function regenerateSession(expiredToken, refreshToken, aggregateData = {}) {
    // search for a regeneration token with the expired token (Should exist only one)
    const regenerationToken = await RegenerationToken.findOne({ refreshToken: refreshToken })

    if (!regenerationToken) {
        throw new Error("Cannot find regeneration token")
    }

    // check if the regeneration token is valid and not expired
    let decodedRefreshToken = null
    let decodedExpiredToken = null

    try {
        decodedRefreshToken = jwt.decode(refreshToken)
        decodedExpiredToken = jwt.decode(expiredToken)
    } catch (error) {
        console.error(error)
        // TODO: Storage this incident
    }

    if (!decodedRefreshToken) {
        throw new Error("Cannot decode refresh token")
    }

    if (!decodedExpiredToken) {
        throw new Error("Cannot decode expired token")
    }

    // is not needed to verify the expired token, because it suppossed to be expired

    // verify refresh token
    await jwt.verify(refreshToken, global.jwtStrategy.secretOrKey, async (err) => {
        // check if is expired
        if (err) {
            if (err.message === "jwt expired") {
                // check if server has enabled the enforcement of regeneration token expiration
                if (global.jwtStrategy.enforceRegenerationTokenExpiration) {
                    // delete the regeneration token
                    await RegenerationToken.deleteOne({ refreshToken: refreshToken })

                    throw new Error("Regeneration token expired and cannot be regenerated due server has enabled enforcement security policy")
                }
            }
        }

        // check if the regeneration token is associated with the expired token
        if (decodedRefreshToken.expiredToken !== expiredToken) {
            throw new Error("Regeneration token is not associated with the expired token")
        }
    })

    // find the session associated with the expired token
    const session = await Session.findOne({ token: expiredToken })

    if (!session) {
        throw new Error("Cannot find session associated with the expired token")
    }

    // generate a new token
    const newToken = await createNewAuthToken({
        username: decodedExpiredToken.username,
        session_uuid: session.session_uuid,
        user_id: decodedExpiredToken.user_id,
        ip_address: aggregateData.ip_address,
    }, {
        updateSession: session._id,
    })

    // delete the regeneration token
    await RegenerationToken.deleteOne({ refreshToken: refreshToken })

    return newToken
}

export async function getRegenerationToken(expiredToken) {
    const regenerationToken = await RegenerationToken.findOne({ expiredToken }).catch((error) => false)

    return regenerationToken ?? false
}

export async function createNewRegenerationToken(expiredToken) {
    // check if token is only expired, if is corrupted, reject
    let decoded = null

    try {
        decoded = jwt.decode(expiredToken)
    } catch (error) {
        console.error(error)
    }

    if (!decoded) {
        return false
    }

    // check if token exists on a session
    const sessions = await Session.find({ user_id: decoded.user_id })
    const currentSession = sessions.find((session) => session.token === expiredToken)

    if (!currentSession) {
        throw new Error("This token is not associated with any session")
    }

    // create a new refresh token and sign it with maximum expiration time of 1 day
    const refreshToken = jwt.sign(
        {
            expiredToken
        },
        global.jwtStrategy.secretOrKey,
        {
            expiresIn: "1d"
        }
    )

    // create a new regeneration token and save it
    const regenerationToken = new RegenerationToken({
        expiredToken,
        refreshToken,
    })

    await regenerationToken.save()

    // return the regeneration token
    return regenerationToken
}

export async function createNewAuthToken(payload, options = {}) {
    if (options.updateSession) {
        const sessionData = await Session.findOne({ _id: options.updateSession })

        payload.session_uuid = sessionData.session_uuid
    } else {
        payload.session_uuid = global.nanoid()
    }

    const token = jwt.sign({
        session_uuid: payload.session_uuid,
        username: payload.username,
        user_id: payload.user_id,
        signLocation: payload.signLocation,
    }, global.jwtStrategy.secretOrKey, {
        expiresIn: global.jwtStrategy.expiresIn ?? "1h",
        algorithm: global.jwtStrategy.algorithm ?? "HS256"
    })

    const session = {
        token: token,
        session_uuid: payload.session_uuid,
        username: payload.username,
        user_id: payload.user_id,
        location: payload.signLocation,
        ip_address: payload.ip_address,
        client: payload.client,
        date: new Date().getTime(),
    }

    if (options.updateSession) {
        await Session.findByIdAndUpdate(options.updateSession, session)
    } else {
        let newSession = new Session(session)

        await newSession.save()
    }

    return token
}