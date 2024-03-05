import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError } from "@shared-classes/Errors"

import ExternalAPI from "@classes/VRCApi"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    req.body = await req.json()

    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            success: false,
            error: "Missing username or password",
        })
    }

    const currentAccessToken = await SecureSyncEntry.get(req.session.user_id.toString(), "vrc:access_token")

    const result = await ExternalAPI.auth({
        username: req.body.username,
        password: req.body.password
    }, currentAccessToken).catch((error) => {
        if (error.response) {
            console.error(error.response.data)

            res.status(500).json(error.response.data.error)
        } else {
            res.status(500).json({
                error: "Something went wrong",
            })
        }

        return null
    })

    if (!result) {
        return false
    }

    console.log(result)

    if (result.cookie) {
        await SecureSyncEntry.set(req.session.user_id.toString(), "vrc:access_token", cookie)
    }

    if (!result.requiresTwoFactorAuth) {
        await SecureSyncEntry.set(req.session.user_id.toString(), "vrc:user_data", JSON.stringify(result))
    }

    return res.json({
        success: result.requiresTwoFactorAuth ? true : false,
        ...result
    })
}