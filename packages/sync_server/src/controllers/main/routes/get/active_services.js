import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const tidal_access = await SecureSyncEntry.has(req.session.user_id.toString(), "tidal_access_token")

    return res.json({
        spotify: null,
        tidal: tidal_access,
    })
}