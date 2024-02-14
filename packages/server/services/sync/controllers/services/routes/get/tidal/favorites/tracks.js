import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError, NotFoundError } from "@shared-classes/Errors"

import TidalAPI from "@shared-classes/TidalAPI"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    try {
        const access_token = await SecureSyncEntry.get(req.session.user_id.toString(), "tidal_access_token")

        if (!access_token) {
            return new AuthorizationError(req, res, "Its needed to link your TIDAL account to perform this action.")
        }

        let user_data = await SecureSyncEntry.get(req.session.user_id.toString(), "tidal_user")

        user_data = JSON.parse(user_data)

        const response = await TidalAPI.getFavoriteTracks({
            user_id: user_data.id,
            country: user_data.countryCode,
            access_token: access_token,
            limit: Number(req.query.limit ?? 50),
            offset: Number(req.query.offset ?? 0),
        })

        return res.json(response)
    } catch (error) {
        return new InternalServerError(req, res, error)
    }
} 