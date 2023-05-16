import jwt_decode from "jwt-decode"
import request from "../../handlers/request"
import Storage from "../../helpers/withStorage"

export default class Session {
    static storageTokenKey = "token"

    static get token() {
        return Storage.engine.get(this.storageTokenKey)
    }

    static set token(token) {
        return Storage.engine.set(this.storageTokenKey, token)
    }

    static get user_id() {
        return this.getDecodedToken()?.user_id
    }

    static get session_uuid() {
        return this.getDecodedToken()?.session_uuid
    }

    static getDecodedToken = () => {
        const token = this.token

        return token && jwt_decode(token)
    }

    static getAllSessions = async () => {
        const response = await request({
            method: "get",
            url: "/session/all"
        })

        return response.data
    }

    static getCurrentSession = async () => {
        const response = await request({
            method: "get",
            url: "/session/current"
        })

        return response.data
    }

    static getTokenValidation = async () => {
        const session = await Session.token

        const response = await request({
            method: "get",
            url: "/session/validate",
            data: {
                session: session
            }
        })

        return response.data
    }

    static removeToken() {
        return Storage.engine.remove(Session.storageTokenKey)
    }

    static destroyCurrentSession = async () => {
        const token = await Session.token
        const session = await Session.getDecodedToken()

        if (!session || !token) {
            return false
        }

        const response = await request({
            method: "delete",
            url: "/session/current"
        }).catch((error) => {
            console.error(error)

            return false
        })

        Session.removeToken()

        __comty_shared_state.emit("session.destroyed")

        return response.data
    }

    static destroyAllSessions = async () => {
        const session = await Session.getDecodedToken()

        if (!session) {
            return false
        }

        const response = await request({
            method: "delete",
            url: "/session/all"
        })

        Session.removeToken()

        __comty_shared_state.emit("session.destroyed")

        return response.data
    }

    static isCurrentTokenValid = async () => {
        const health = await Session.getTokenValidation()

        return health.valid
    }
}