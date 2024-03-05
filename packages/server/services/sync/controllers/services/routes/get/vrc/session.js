import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const userData = await SecureSyncEntry.get(req.session.user_id.toString(), "vrc:user_data")

    return res.json(JSON.parse(userData))
}