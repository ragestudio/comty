import cookies from "js-cookie"
import jwt_decode from "jwt-decode"
import config from "config"

export default class Session {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static tokenKey = config.app?.storage?.token ?? "token"

    static get token() {
        return cookies.get(this.tokenKey)
    }

    static set token(token) {
        return cookies.set(this.tokenKey, token)
    }

    static async delToken() {
        return cookies.remove(Session.tokenKey)
    }

    static async decodedToken() {
        const token = await this.token
        return token && jwt_decode(token)
    }

    //* BASIC HANDLERS
    login = (payload, callback) => {
        const body = {
            username: payload.username, //window.btoa(payload.username),
            password: payload.password, //window.btoa(payload.password),
        }

        return this.generateNewToken(body, (err, res) => {
            if (typeof callback === "function") {
                callback(err, res)
            }

            if (!err || res.status === 200) {
                let token = res.data

                if (typeof token === "object") {
                    token = token.token
                }

                Session.token = token
                window.app.eventBus.emit("new_session")
            }
        })
    }

    logout = async () => {
        await this.destroyCurrentSession()
        this.forgetLocalSession()
    }

    //* GENERATORS
    generateNewToken = async (payload, callback) => {
        const request = await Session.bridge.post.login(payload, undefined, {
            parseData: false
        })

        if (typeof callback === "function") {
            callback(request.error, request.response)
        }

        return request
    }

    //* GETTERS
    getAllSessions = async () => {
        return await Session.bridge.get.sessions()
    }

    getTokenInfo = async () => {
        const session = await Session.token

        return await Session.bridge.post.validateSession({ session })
    }

    getCurrentSession = async () => {
        return await Session.bridge.get.currentSession()
    }

    isCurrentTokenValid = async () => {
        const health = await this.getTokenInfo()

        return health.valid
    }

    forgetLocalSession = () => {
        return Session.delToken()
    }

    destroyAllSessions = async () => {
        const session = await Session.decodedToken()

        if (!session) {
            return false
        }

        const result = await Session.bridge.delete.sessions({ user_id: session.user_id })
        this.forgetLocalSession()
        window.app.eventBus.emit("destroyed_session")

        return result
    }

    destroyCurrentSession = async () => {
        const token = await Session.token
        const session = await Session.decodedToken()

        if (!session || !token) {
            return false
        }

        const result = await Session.bridge.delete.session({ user_id: session.user_id, token: token })
        this.forgetLocalSession()
        window.app.eventBus.emit("destroyed_session")

        return result
    }

    logout = this.destroyCurrentSession
}