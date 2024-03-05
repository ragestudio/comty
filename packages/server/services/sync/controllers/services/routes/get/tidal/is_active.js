import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let hasUser = await SecureSyncEntry.has(req.session.user_id.toString(), "tidal_user")

    if (!hasUser) {
        return new NotFoundError(req, res, "This account is not linked to a TIDAL account.")
    }

    return res.json({
        active: hasUser
    })
}