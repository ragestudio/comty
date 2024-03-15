import GetPostData from "./data"

export default async (payload = {}) => {
    let {
        user_id,
        trim,
        limit,
    } = payload

    let query = {}

    const posts = await GetPostData({
        for_user_id: user_id,
        trim,
        limit,
        query: query,
    })

    return posts
}