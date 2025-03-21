import { User } from "@db_models"

export default {
	key: "users",
	model: User,
	query: (keywords) => {
		return {
			$or: [
				{ username: new RegExp(keywords, "i") },
				{ public_name: new RegExp(keywords, "i") },
			],
		}
	},
}
