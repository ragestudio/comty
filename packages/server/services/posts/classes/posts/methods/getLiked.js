import { PostLike } from "@db_models"
import GetData from "./data"

export default async (payload = {}) => {
    let { user_id, trim, limit } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    let ids = await PostLike.find({ user_id })

    ids = ids.map((item) => item.post_id)

    return await GetData({
        trim: trim,
        limit: limit,
        for_user_id: user_id,
        query: {
            _id: {
                $in: ids
            }
        }
    })
}

