import SessionModel from "../models/session"
import request from "../handlers/request"
import { reconnectWebsockets } from "../"

export default async (refreshToken) => {
    __comty_shared_state.eventBus.emit("session.expiredExceptionEvent", refreshToken)

    __comty_shared_state.onExpiredExceptionEvent = true

    const expiredToken = await SessionModel.token

    // send request to regenerate token
    const response = await request({
        method: "POST",
        url: "/session/regenerate",
        data: {
            expiredToken: expiredToken,
            refreshToken,
        }
    }).catch((error) => {
        console.error(`Failed to regenerate token: ${error.message}`)
        return false
    })

    if (!response) {
        return __comty_shared_state.eventBus.emit("session.invalid", "Failed to regenerate token")
    }

    if (!response.data?.token) {
        return __comty_shared_state.eventBus.emit("session.invalid", "Failed to regenerate token, invalid server response.")
    }

    // set new token
    SessionModel.token = response.data.token

    __comty_shared_state.onExpiredExceptionEvent = false

    // emit event
    __comty_shared_state.eventBus.emit("session.regenerated")

    // reconnect websockets
    reconnectWebsockets()
}