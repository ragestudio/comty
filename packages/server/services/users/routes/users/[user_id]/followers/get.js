import User from "@classes/users"

export default {
    fn: async (req) => {
        return await User.getFollowers({
            user_id: req.params.user_id,
            data: ToBoolean(req.query.fetchData),
            limit: req.query.limit,
            offset: req.query.offset,
        })
    }
}