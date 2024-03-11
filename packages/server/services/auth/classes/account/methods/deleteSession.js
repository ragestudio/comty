import { Session } from "@db_models"

export default async (payload = {}) => {
    const { user_id, token } = payload

    if (!user_id) {
        throw new OperationError(400, "user_id not provided")
    }

    if (!token) {
        throw new OperationError(400, "token not provided")
    }

    const session = await Session.findOne({
        user_id,
        token
    })

    if (!session) {
        throw new OperationError(400, "Session not found")
    }

    await session.delete()

    return {
        success: true
    }
}