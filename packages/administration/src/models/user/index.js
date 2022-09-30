import Session from "../session"

export default class User {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async data() {
        const token = await Session.decodedToken()

        if (!token || !User.bridge) {
            return false
        }

        return User.bridge.get.user(undefined, { username: token.username, _id: token.user_id })
    }

    static async roles() {
        const token = await Session.decodedToken()

        if (!token || !User.bridge) {
            return false
        }

        return User.bridge.get.userRoles(undefined, { username: token.username })
    }

    static async hasRole(role) {
        const roles = await User.roles()

        if (!roles) {
            return false
        }

        return Array.isArray(roles) && roles.includes(role)
    }

    static async selfUserId() {
        const token = await Session.decodedToken()

        if (!token) {
            return false
        }

        return token.user_id
    }

    static async hasAdmin() {
        return User.hasRole("admin")
    }

    getData = async (payload, callback) => {
        const request = await User.bridge.get.user(undefined, { username: payload.username, _id: payload.user_id }, {
            parseData: false
        })

        if (typeof callback === "function") {
            callback(request.error, request.response)
        }

        return request.response.data
    }
}