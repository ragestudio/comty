import { User, Session, Post } from "@db_models"

export default {
	method: "GET",
	middlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		// get number of users registered,
		const users = await User.countDocuments()

		// calculate the last 5 days logins from diferent users
		let last5D_logins = await Session.find({
			date: {
				$gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
				$lte: new Date(),
			},
		})

		const last5D_logins_counts = []

		// filter from different users
		last5D_logins.forEach((session) => {
			if (!last5D_logins_counts.includes(session.user_id)) {
				last5D_logins_counts.push(session.user_id)
			}
		})

		// calculate active users within 1 week (using postings)
		const active_1w_posts_users = await Post.countDocuments({
			user_id: {
				$in: last5D_logins_counts,
			},
			created_at: {
				$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				$lte: new Date(),
			},
		})

		// calculate total posts
		const total_posts = await Post.countDocuments()

		// calculate total post (1week)
		const total_posts_1w = await Post.countDocuments({
			created_at: {
				$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				$lte: new Date(),
			},
		})

		return {
			accounts_registered: users,
			last5D_logins: last5D_logins_counts.length,
			active_1w_posts_users: active_1w_posts_users,
			total_posts: total_posts,
			total_posts_1w: total_posts_1w,
		}
	},
}
