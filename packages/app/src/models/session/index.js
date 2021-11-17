import cookies from 'js-cookie'
import jwt_decode from "jwt-decode"
import config from 'config'

export default class Session {
    static get bridge() {
        return window.app?.apiBridge
    }

    static tokenKey = config.app?.storage?.token ?? "token"

    static get token() {
        return cookies.get(this.tokenKey)
    }

    static set token(token) {
        return cookies.set(this.tokenKey, token)
    }

    static get decodedToken() {
        return this.token && jwt_decode(this.token)
    }

    //* BASIC HANDLERS
    login = (payload, callback) => {
        const body = {
            username: window.btoa(payload.username),
            password: window.btoa(payload.password),
            allowRegenerate: payload.allowRegenerate
        }

        return this.generateNewToken(body, (err, res) => {
            if (typeof callback === 'function') {
                callback(err, res)
            }

            if (!err || res.status === 200) {
                let token = res.data

                if (typeof token === 'object') {
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

        if (typeof callback === 'function') {
            callback(request.error, request.response)
        }

        return request
    }

    regenerateToken = async () => {
        return await Session.bridge.post.regenerate()
    }

    //* GETTERS
    getAllSessions = async () => {
        return await Session.bridge.get.sessions()
    }

    getTokenInfo = async () => {
        const session = Session.token

        return await Session.bridge.post.validateSession({ session })
    }

    isCurrentTokenValid = async () => {
        const health = await this.getTokenInfo()

        return health.valid
    }

    forgetLocalSession = () => {
        cookies.remove(this.tokenKey)
    }

    destroyAllSessions = async () => {
        const session = Session.decodedToken

        if (!session) {
            return false
        }

        const result = await Session.bridge.delete.sessions({ user_id: session.user_id })
        this.forgetLocalSession()
        window.app.eventBus.emit("destroyed_session")

        return result
    }

    destroyCurrentSession = async () => {
        const token = Session.token
        const session = Session.decodedToken

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