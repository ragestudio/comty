import SecureSyncEntry from "@shared-classes/SecureSyncEntry"
import { AuthorizationError, InternalServerError } from "@shared-classes/Errors"

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

		let response = await TidalAPI.toggleTrackLike({
			trackId: req.params.track_id,
			to: true,
			user_id: user_data.id,
			access_token,
			country: user_data.countryCode,
		})

		return res.json(response)
	} catch (error) {
		console.error(error)
		return new InternalServerError(req, res, error)
	}
}
