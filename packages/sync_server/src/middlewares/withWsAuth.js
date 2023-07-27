export default async (socket, next) => {
    try {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error(`auth:token_missing`))
        }

        const validation = await global.comty.rest.session.validateToken(token).catch((err) => {
            console.error(`[${socket.id}] failed to validate session caused by server error`, err)

            return {
                valid: false,
                error: err,
            }
        })

        if (!validation.valid) {
            if (validation.error) {
                return next(new Error(`auth:server_error`))
            }

            return next(new Error(`auth:token_invalid`))
        }

        const session = validation.session

        const userData = await global.comty.rest.user.data({
            user_id: session.user_id,
        }).catch((err) => {
            console.error(`[${socket.id}] failed to get user data caused by server error`, err)

            return null
        })

        if (!userData) {
            return next(new Error(`auth:user_failed`))
        }

        try {
            socket.userData = userData
            socket.token = token
            socket.session = session
        }
        catch (err) {
            return next(new Error(`auth:decode_failed`))
        }

        next()
    } catch (error) {
        console.error(`[${socket.id}] failed to connect caused by server error`, error)

        next(new Error(`auth:authentification_failed`))
    }
}