import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError, NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let user = await SecureSyncEntry.get(req.session.user_id.toString(), "tidal_user")

    try {
        user = JSON.parse(user)

        if (!user) {
            return new NotFoundError(req, res)
        }

        return res.json(user)
    } catch (error) {
        return new InternalServerError(req, res)
    }
}