import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError } from "@shared-classes/Errors"

import TidalAPI from "@shared-classes/TidalAPI"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const authProcess = await TidalAPI.getAuthUrl()

    if (!authProcess) {
        return new InternalServerError(req, res)
    }

    const checkInterval = setInterval(async () => {
        const response = await TidalAPI.checkAuthStatus(authProcess.device_code).catch(() => {
            return false
        })

        if (response) {
            const userData = {
                id: response.user.userId,
                email: response.user.email,
                username: response.user.username,
                countryCode: response.user.countryCode,
            }

            // save to SecureSyncEntry
            await SecureSyncEntry.set(req.session.user_id.toString(), "tidal_user", JSON.stringify(userData))
            await SecureSyncEntry.set(req.session.user_id.toString(), "tidal_access_token", response.access_token)
            await SecureSyncEntry.set(req.session.user_id.toString(), "tidal_refresh_token", response.refresh_token)

            return clearInterval(checkInterval)
        }
    }, 3000)

    setTimeout(() => {
        clearInterval(checkInterval)
    }, authProcess.expires_in * 1000)

    return res.json({
        auth_url: authProcess.url,
        device_code: authProcess.deviceCode,
    })
}