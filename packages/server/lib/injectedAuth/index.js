import AuthToken from "../../classes/AuthToken"
import { User } from "../../db_models"

export default async (obj, token) => {
	const validation = await AuthToken.validate(token)

	if (!validation.valid) {
		if (validation.error) {
			throw new Error(`Server error`)
		}

		throw new Error(`Invalid token`)
	}

	let userData = await User.findById(validation.data.user_id).lean()

	if (!userData) {
		throw new Error(`User not found`)
	}

	userData._id = userData._id.toString()

	// inject to obj
	obj.user = userData
	obj.token = token
	obj.session = validation.data

	return obj
}
