import handleRegenerationEvent from "./handleRegenerationEvent"

export default async (data, callback) => {
    // handle 401, 403 responses
    if (data instanceof Error) {
        if (data.code && (data.code === "ECONNABORTED" || data.code === "ERR_NETWORK")) {
            console.error(`Request aborted or network error, ignoring`)
            return false
        }

        if (data.response.status === 401) {
            // check if the server issue a refresh token on data
            if (data.response.data.refreshToken) {
                console.log(`Session expired, but the server issued a refresh token, handling regeneration event`)

                // handle regeneration event
                await handleRegenerationEvent(data.response.data.refreshToken)

                return await callback()
            }

            // check if route is from "session" namespace
            if (data.config.url.includes("/session")) {
                return __comty_shared_state.eventBus.emit("session.invalid", "Session expired, but the server did not issue a refresh token")
            }
        }

        if (data.response.status === 403) {
            if (data.config.url.includes("/session")) {
                return __comty_shared_state.eventBus.emit("session.invalid", "Session not valid or not existent")
            }
        }
    }
}