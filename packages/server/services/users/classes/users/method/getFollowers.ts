import User from "@db_models/user"
import UserFollow from "@db_models/userFollow"

export type GetFollowersPayload = {
	user_id: string
	data?: boolean
	limit?: number
	page?: number
}

export type GetFollowersDataResult = {
	items: any[]
	total_items: number
	has_more: boolean
}

export type GetFollowersCountResult = {
	count: number
}

export type GetFollowersResult =
	| GetFollowersDataResult
	| GetFollowersCountResult

export default async (
	payload: GetFollowersPayload = {} as GetFollowersPayload,
): Promise<GetFollowersResult> => {
	const { user_id, data = false, limit = 50, page = 0 } = payload

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const total_followers = await UserFollow.countDocuments({
		to: user_id,
	})

	if (data === true) {
		const followers = await UserFollow.find({
			to: user_id,
		})
			.limit(limit)
			.skip(limit * page)
			.lean()

		const followerIds = followers.map((follow) => follow.user_id)

		const followersData = await User.find({
			_id: {
				$in: followerIds,
			},
		})

		const nextPage = page + 1

		return {
			items: followersData,
			total_items: total_followers,
			has_more: total_followers > limit * nextPage,
		}
	}

	return {
		count: total_followers,
	}
}
