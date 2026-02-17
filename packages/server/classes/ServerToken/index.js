import { User, ServerKeys } from "@db_models"

export default class ServerToken {
	static async validate(access_id, secret_token) {
		let result = {
			valid: false,
			error: null,
		}

		if (access_id === "undefined" || secret_token === "undefined") {
			result.valid = false
			result.error = "Missing access_id or/and secret_token"

			return result
		}

		const serverTokenEntry = await ServerKeys.findOne({
			access_id,
		}).select("+secret_token")

		if (!serverTokenEntry) {
			result.valid = false
			result.error = "Cannot find server token"

			return result
		}

		if (serverTokenEntry.secret_token !== secret_token) {
			result.valid = false
			result.error = "Missmatching secret_token"

			return result
		}

		// set as valid
		result.valid = true

		// set data
		result.data = serverTokenEntry.toObject()

		// set user fetcher fn
		result.user = async () => {
			return await User.findOne({
				_id: serverTokenEntry.owner_user_id,
			})
		}

		return result
	}
}
