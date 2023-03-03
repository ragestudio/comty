import { Post, } from "@models"
import toogleLike from "../../PostsController/services/toogleLike"

export default {
    method: "POST",
    route: "/:post_id/mok_likes",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req, res) => {
        const {
            count,
            interval = 100,
        } = req.body

        if (count < 1) {
            return res.status(400).json({
                error: "Invalid count, must be greater than 0",
            })
        }

        let postData = await Post.findById(req.params.post_id)

        if (!postData) {
            return res.status(404).json({
                error: "Post not found",
            })
        }

        for (let i = 0; i < count; i++) {
            const mokUserId = `mok_${i}_${count}`

            toogleLike({
                post_id: postData._id.toString(),
                user_id: mokUserId,
                to: true
            })

            await new Promise((resolve) => setTimeout(resolve, interval ?? 100))

            continue
        }

        return res.status(200).json({
            message: "Success",
            data: postData
        })
    }
}