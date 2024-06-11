import Users from "@classes/users"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const data = await Users.data({
            user_id: user_id,
        })

        if (!data) {
            throw new OperationError(404, "User not found")
        }

        return data.roles
    }
}