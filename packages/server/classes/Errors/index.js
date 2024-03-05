export class AuthorizationError extends Error {
    constructor(req, res, message = "This endpoint requires authorization") {
        super(message)
        this.name = "AuthorizationError"

        if (req && res) {
            return res.status(this.constructor.statusCode).json({
                error: message,
            })
        }
    }

    static get statusCode() {
        return 401
    }
}

export class NotFoundError extends Error {
    constructor(req, res, message = "Not found") {
        super(message)
        this.name = "NotFoundError"

        if (req && res) {
            return res.status(this.constructor.statusCode).json({
                error: message,
            })
        }
    }

    static get statusCode() {
        return 404
    }
}

export class PermissionError extends Error {
    constructor(req, res, message = "You don't have permission to do this") {
        super(message)
        this.name = "PermissionError"

        if (req && res) {
            return res.status(this.constructor.statusCode).json({
                error: message,
            })
        }
    }

    static get statusCode() {
        return 403
    }
}

export class BadRequestError extends Error {
    constructor(req, res, message = "Bad request") {
        super(message)
        this.name = "BadRequestError"

        if (req && res) {
            return res.status(this.constructor.statusCode).json({
                error: message,
            })
        }
    }

    static get statusCode() {
        return 400
    }
}

export class InternalServerError extends Error {
    constructor(req, res, message = "Internal server error") {
        super(message)
        this.name = "InternalServerError"

        if (req && res) {
            return res.status(this.constructor.statusCode).json({
                error: message,
            })
        }
    }

    static get statusCode() {
        return 500
    }
}