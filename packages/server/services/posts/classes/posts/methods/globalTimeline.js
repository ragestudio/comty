import GetPostData from "./data"

export default async (payload = {}) => {
    let {
        user_id,
        trim,
        limit,
    } = payload

    const posts = await GetPostData({
        for_user_id: user_id,
        trim,
        limit,
    })

    return posts
}