import { Session } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { token, session } = req.auth

        const deletedSession = await Session.findOneAndDelete({
            user_id: session.user_id,
            token: token,
        })

        if (session) {
            return {
                message: "Session deleted",
                session: deletedSession
            }
        }

        throw new OperationError(404, "Session not found")
    }
}