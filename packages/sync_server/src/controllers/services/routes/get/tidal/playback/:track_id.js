import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError, NotFoundError } from "@shared-classes/Errors"

import TidalAPI from "@shared-classes/TidalAPI"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const access_token = await SecureSyncEntry.get(req.session.user_id.toString(), "tidal_access_token")

    if (!access_token) {
        return new AuthorizationError(req, res, "Its needed to link your TIDAL account to perform this action.")
    }

    const response = await TidalAPI.getTrackPlaybackUrl({
        track_id: req.params.track_id,
        access_token: access_token
    })

    if (!response) {
        return new NotFoundError(req, res, "Track is not available")
    }

    return res.json(response)
}