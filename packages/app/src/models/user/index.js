import Session from "../session"

export default class User {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async data(payload) {
        const token = await Session.decodedToken()

        if (!token || !User.bridge) {
            return false
        }

        return User.bridge.get.user(undefined, payload ?? { username: token.username })
    }

    static async dataByUsername(username) {
        if (!username) {
            throw new Error("username is required")
        }

        return User.bridge.get.user(undefined, { username })
    }

    static async dataById(user_id) {
        if (!user_id) {
            throw new Error("user_id is required")
        }

        return User.bridge.get.user(undefined, { _id: user_id })
    }

    static async publicData() {
        const token = await Session.decodedToken()

        if (!token) {
            return false
        }

        return User.bridge.get.userPublicData({ username: token.username })
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

    static async register(payload) {
        if (!User.bridge) {
            return false
        }

        const { username, password, email } = payload

        const response = await User.bridge.post.register(undefined, {
            username,
            password,
            email,
        }).catch((error) => {
            console.error(error)

            return false
        })

        if (!response) {
            throw new Error("Unable to register user")
        }

        return response
    }

    static async changePassword(payload) {
        if (!User.bridge) {
            return false
        }

        const { currentPassword, newPassword } = payload

        const { data } = await app.api.customRequest("main", {
            method: "POST",
            url: "/self/update_password",
            data: {
                currentPassword,
                newPassword,
            }
        })

        return data
    }

    static async getConnectedUsersFollowing() {
        if (!User.bridge) {
            return false
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: "/connected_users_following",
        })

        return data
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