import { UserFollow } from "@db_models"

import GetPostData from "./data"

export default async (payload = {}) => {
	payload.query = {}

	//TODO: include posts from groups
	//TODO: include promotional posts
	if (payload.for_user_id) {
		const from_users = []

		from_users.push(payload.for_user_id)

		// get post from users that the user follows
		const followingUsers = await UserFollow.find({
			user_id: payload.for_user_id,
		})

		const followingUserIds = followingUsers.map(
			(followingUser) => followingUser.to,
		)

		from_users.push(...followingUserIds)

		payload.query.user_id = {
			$in: from_users,
		}
	}

	const posts = await GetPostData(payload)

	return posts
}
