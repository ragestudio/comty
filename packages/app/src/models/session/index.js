import cookies from "js-cookie"
import jwt_decode from "jwt-decode"
import config from "config"

export default class Session {
    static storageTokenKey = config.app?.storage?.token ?? "token"

    static get token() {
        return cookies.get(this.storageTokenKey)
    }

    static set token(token) {
        return cookies.set(this.storageTokenKey, token)
    }

    static get user_id() {
        return this.getDecodedToken()?.user_id
    }

    static get session_uuid() {
        return this.getDecodedToken()?.session_uuid
    }

    static getDecodedToken() {
        const token = this.token

        return token && jwt_decode(token)
    }

    static async getAllSessions() {
        const response = await app.api.customRequest("main", {
            method: "get",
            url: "/session/all"
        })

        return response.data
    }

    static async getCurrentSession() {
        const response = await app.api.customRequest("main", {
            method: "get",
            url: "/session/current"
        })

        return response.data
    }

    static async getTokenValidation() {
        const session = await Session.token

        const response = await app.api.customRequest("main", {
            method: "get",
            url: "/session/validate",
            data: {
                session: session
            }
        })

        return response.data
    }

    static removeToken() {
        return cookies.remove(Session.storageTokenKey)
    }

    static async destroyCurrentSession() {
        const token = await Session.token
        const session = await Session.getDecodedToken()

        if (!session || !token) {
            return false
        }

        const response = await app.api.customRequest("main", {
            method: "delete",
            url: "/session/current"
        }).catch((error) => {
            console.error(error)

            return false
        })

        Session.removeToken()

        window.app.eventBus.emit("session.destroyed")

        return response.data
    }

    static async destroyAllSessions() {
        const session = await Session.getDecodedToken()

        if (!session) {
            return false
        }

        const response = await app.api.customRequest("main", {
            method: "delete",
            url: "/session/all"
        })

        Session.removeToken()

        window.app.eventBus.emit("session.destroyed")

        return response.data
    }

    static async isCurrentTokenValid() {
        const health = await Session.getTokenValidation()

        return health.valid
    }
}