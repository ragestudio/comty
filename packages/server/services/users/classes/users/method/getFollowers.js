import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
	const { user_id, data = false, limit = 50, page = 0 } = payload

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const total_followers = await UserFollow.countDocuments({
		to: user_id,
	})

	if (data === true) {
		let followers = await UserFollow.find({
			to: user_id,
		})
			.limit(limit)
			.skip(limit * page)
			.lean()

		followers = followers.map((follow) => {
			return follow.user_id
		})

		const followersData = await User.find({
			_id: {
				$in: followers,
			},
		})

		const nextPage = page + 1

		return {
			items: followersData,
			total_items: total_followers,
			has_more: total_followers > limit * nextPage,
		}
	} else {
		return {
			count: total_followers,
		}
	}
}
