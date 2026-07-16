import { Post } from "@db_models"

const classifyAPI = "https://vision-service.ragestudio.net"

const adultLevels = [
	"VERY_UNLIKELY",
	"UNLIKELY",
	"POSSIBLE",
	"LIKELY",
	"VERY_LIKELY",
]

export default {
	id: "classify_post_attachments",
	maxJobs: 100,
	process: async (job) => {
		const { post_id, auth_token } = job.data

		let post = await Post.findById(post_id).lean()

		console.log(`[CLASSIFY] Checking post ${post_id}`)

		if (!post) {
			return false
		}

		if (!Array.isArray(post.attachments)) {
			return false
		}

		for await (const attachment of post.attachments) {
			if (!attachment.url) {
				continue
			}

			const params = new URLSearchParams({ url: attachment.url })
			const response = await fetch(
				`${classifyAPI}/safe_detect?${params}`,
				{
					headers: {
						Authorization: auth_token,
					},
				},
			)

			const data = await response.json()

			console.log(
				`[CLASSIFY] Attachment [${attachment.url}] classified as ${data.detections.adult}`,
			)

			const adultLevel = adultLevels.indexOf(data.detections.adult)

			if (!Array.isArray(attachment.flags)) {
				attachment.flags = []
			}

			if (adultLevel > 2) {
				attachment.flags.push("nsfw")
			}
		}

		await Post.findByIdAndUpdate(post._id, post)
	},
}
