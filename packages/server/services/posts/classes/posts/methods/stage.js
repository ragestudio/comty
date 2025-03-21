import { User, PostLike, PostSave, Post, VotePoll } from "@db_models"

export default async (payload = {}) => {
	let { posts, for_user_id } = payload

	if (!Array.isArray(posts)) {
		posts = [posts]
	}

	if (posts.every((post) => !post)) {
		return []
	}

	let postsSavesIds = []

	if (for_user_id) {
		const postsSaves = await PostSave.find({ user_id: for_user_id }).sort({
			saved_at: -1,
		})

		postsSavesIds = postsSaves.map((postSave) => postSave.post_id)
	}

	const postsIds = posts.map((post) => post._id)
	const usersIds = posts.map((post) => post.user_id)

	let [usersData, likesData, pollVotes] = await Promise.all([
		User.find({
			_id: {
				$in: usersIds,
			},
		}).catch(() => {}),
		PostLike.find({
			post_id: {
				$in: postsIds,
			},
		}).catch(() => []),
		VotePoll.find({
			post_id: {
				$in: postsIds,
			},
		}).catch(() => []),
	])

	// wrap likesData by post_id
	likesData = likesData.reduce((acc, like) => {
		if (!acc[like.post_id]) {
			acc[like.post_id] = []
		}

		acc[like.post_id].push(like)

		return acc
	}, {})

	posts = await Promise.all(
		posts.map(async (post, index) => {
			if (typeof post.toObject === "function") {
				post = post.toObject()
			}

			if (post.visibility === "private" && post.user_id !== for_user_id) {
				return null
			}

			if (
				post.visibility === "only_mutuals" &&
				post.user_id !== for_user_id
			) {
				// TODO
				return null
			}

			let user = usersData.find(
				(user) => user._id.toString() === post.user_id.toString(),
			)

			if (!user) {
				user = {
					_deleted: true,
					username: "Deleted user",
				}
			}

			if (post.reply_to) {
				post.reply_to_data = await Post.findById(post.reply_to)

				if (post.reply_to_data) {
					post.reply_to_data = post.reply_to_data.toObject()

					const replyUserData = await User.findById(
						post.reply_to_data.user_id,
					)

					if (replyUserData) {
						post.reply_to_data.user = replyUserData.toObject()
					}
				}
			}

			post.hasReplies = await Post.countDocuments({ reply_to: post._id })

			let likes = likesData[post._id.toString()] ?? []

			post.countLikes = likes.length

			const postPollVotes = pollVotes.filter((vote) => {
				if (vote.post_id !== post._id.toString()) {
					return false
				}

				return true
			})

			if (for_user_id) {
				post.isLiked = likes.some(
					(like) => like.user_id.toString() === for_user_id,
				)
				post.isSaved = postsSavesIds.includes(post._id.toString())

				if (Array.isArray(post.poll_options)) {
					post.poll_options = post.poll_options.map((option) => {
						option.voted = !!postPollVotes.find((vote) => {
							if (vote.user_id !== for_user_id) {
								return false
							}

							if (vote.option_id !== option.id) {
								return false
							}

							return true
						})

						option.count = postPollVotes.filter((vote) => {
							if (vote.option_id !== option.id) {
								return false
							}

							return true
						}).length

						return option
					})
				}
			}

			post.share_url = `${process.env.APP_URL}/post/${post._id}`

			return {
				...post,
				user,
			}
		}),
	)

	// clear undefined and null
	posts = posts.filter((post) => post !== undefined && post !== null)

	return posts
}
