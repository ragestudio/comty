import Users from "@classes/users"

// resolve user id from a username (passed from params)
export default {
    fn: async (req) => {
        return await Users.resolveUserId({
            username: req.params.user_id,
        })
    },
}