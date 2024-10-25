import AuthToken from "@shared-classes/AuthToken"

export default async (req, res) => {
    const { token } = req.body

    if (!token) {
        throw new OperationError(400, "Missing token")
    }

    const validation = await AuthToken.validate(token)

    if (!validation.valid) {
        throw new OperationError(401, "Invalid token")
    }

    return {
        token: token,
        decoded: validation.data,
        session: validation.session,
        user: validation.user
    }
}