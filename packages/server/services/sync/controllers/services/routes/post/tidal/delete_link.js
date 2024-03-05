import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    await SecureSyncEntry.delete(req.session.user_id.toString(), "tidal_user")
    await SecureSyncEntry.delete(req.session.user_id.toString(), "tidal_access_token")
    await SecureSyncEntry.delete(req.session.user_id.toString(), "tidal_refresh_token")

    return res.json({
        success: true
    })
}