export default async (password) => {
    if (password.length < 8) {
        throw new OperationError(400, "Password must be at least 8 characters")
    }

    if (password.length > 64) {
        throw new OperationError(400, "Password cannot be longer than 64 characters")
    }

    return true
}