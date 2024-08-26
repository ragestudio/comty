import { ServerKeys } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { access_id } = req.params
        const { user_id } = req.auth.session

        const serverKey = await ServerKeys.findOne({
            access_id: access_id,
            owner_user_id: user_id
        })

        if (!serverKey) {
            throw new OperationError(404, "Server key not found")
        }

        await ServerKeys.findOneAndDelete({
            access_id: access_id,
            owner_user_id: user_id,
        })

        return {
            deleted: true
        }
    }
}