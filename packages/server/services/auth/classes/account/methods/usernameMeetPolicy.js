export default async (username) => {
    if (username.length < 3) {
        throw new OperationError(400, "Username must be at least 3 characters")
    }

    if (username.length > 64) {
        throw new OperationError(400, "Username cannot be longer than 64 characters")
    }

    // if username has capital letters, throw error
    if (username !== username.toLowerCase()) {
        throw new OperationError(400, "Username must be lowercase")
    }

    // make sure the username has no spaces
    if (username.includes(" ")) {
        throw new OperationError(400, "Username cannot contain spaces")
    }

    // make sure the username has no valid characters. Only letters, numbers, and underscores
    if (!/^[a-z0-9_]+$/.test(username)) {
        throw new OperationError(400, "Username can only contain letters, numbers, and underscores")
    }

    return true
}
