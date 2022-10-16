import { Post } from "../../../models"
import indecentPrediction from "../../../utils/indecent-prediction"
import isNSFW from "../../../utils/is-nsfw"

import modifyPostData from "./modifyPostData"

export default async (post_id) => {
    if (!post_id) {
        throw new Error("Post ID is required")
    }

    let post = await Post.findById(post_id)

    if (!post) {
        throw new Error("Post not found")
    }

    let flags = []

    // run indecentPrediction to all attachments
    if (Array.isArray(post.attachments) && post.attachments.length > 0) {
        for await (const attachment of post.attachments) {
            const prediction = await indecentPrediction({
                url: attachment.url,
            }).catch((err) => {
                console.log("Error while checking", attachment, err)
                return null
            })

            if (prediction) {
                const isNsfw = isNSFW(prediction)

                if (isNsfw) {
                    flags.push("nsfw")
                }
            }
        }
    }

    // if is there new flags update post
    if (post.flags !== flags) {
        await modifyPostData(post_id, {
            flags: flags,
        })
    }

    return flags
}