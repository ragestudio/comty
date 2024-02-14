import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError } from "@shared-classes/Errors"

import ExternalAPI from "@classes/VRCApi"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    req.body = await req.json()

    const { type, code } = req.body

    if (!type || !code) {
        return res.status(400).json({
            success: false,
            error: "Missing type or code",
        })
    }

    const authcookie = await SecureSyncEntry.get(req.session.user_id.toString(), "vrc:access_token")

    const result = await ExternalAPI.verifyOtp({ type, code }, authcookie).catch((error) => {
        if (error.response) {
            console.error(error.response.data)

            res.status(500).json(error.response.data.error)
        } else {
            console.error(error)

            res.status(500).json({
                error: "Something went wrong",
            })
        }

        return null
    })

    if (!result) {
        return false
    }

    return res.json(result)
}