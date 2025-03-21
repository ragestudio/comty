import { Post } from "@db_models"
import axios from "axios"

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

			const response = await axios({
				method: "GET",
				url: `${classifyAPI}/safe_detect`,
				headers: {
					Authorization: auth_token,
				},
				params: {
					url: attachment.url,
				},
			})

			console.log(
				`[CLASSIFY] Attachment [${attachment.url}] classified as ${response.data.detections.adult}`,
			)

			const adultLevel = adultLevels.indexOf(
				response.data.detections.adult,
			)

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
