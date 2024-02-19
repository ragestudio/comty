import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

<<<<<<< HEAD:packages/server/services/sync/controllers/services/routes/get/vrc/session.js
    const userData = await SecureSyncEntry.get(req.session.user_id.toString(), "vrc:user_data")

    return res.json(JSON.parse(userData))
=======
    let access = {}

    const check_map = [
        ["vrc", async () => await SecureSyncEntry.has(req.session.user_id.toString(), "vrc_access_token")],
        ["tidal", async () => await SecureSyncEntry.has(req.session.user_id.toString(), "tidal_access_token")],
        ["spotify", async () => await SecureSyncEntry.has(req.session.user_id.toString(), "spotify_access_token")],
    ]

    try {
        for (const check of check_map) {
            const [service, fn] = check

            if (await fn()) {
                access[service] = true
            } else {
                access[service] = false
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.json(access)
>>>>>>> 7949bb9eca984e4628fd0ea93c11fe358053ed56:packages/sync_server/src/controllers/main/routes/get/active_services.js
}