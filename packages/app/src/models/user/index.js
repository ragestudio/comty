import SessionModel from "../session"

export default class User {
    static async data(payload = {}) {
        let {
            username,
            user_id,
        } = payload

        if (!username && !user_id) {
            user_id = SessionModel.user_id
        }

        if (username && !user_id) {
            // resolve user_id from username
            const resolveResponse = await app.api.customRequest("main", {
                method: "GET",
                url: `/user/user_id/${username}`,
            })

            user_id = resolveResponse.data.user_id
        }

        const response = await app.api.customRequest("main", {
            method: "GET",
            url: `/user/${user_id}/data`,
        })

        return response.data
    }

    static async updateData(payload) { 
        const response = await app.api.customRequest("main", {
            method: "POST",
            url: "/user/self/update_data",
            data: {
                update: payload,
            },
        })

        return response.data
    }

    static async unsetFullName() {
        const response = await app.api.customRequest("main", {
            method: "DELETE",
            url: "/user/self/public_name",
        })

        return response.data
    }

    static async selfRoles() {
        const response = await app.api.customRequest("main", {
            method: "GET",
            url: "/roles/self",
        })

        return response.data
    }

    static async haveRole(role) {
        const roles = await User.selfRoles()

        if (!roles) {
            return false
        }

        return Array.isArray(roles) && roles.includes(role)
    }

    static async haveAdmin() {
        return User.haveRole("admin")
    }

    static async getUserBadges(user_id) {
        if (!user_id) {
            user_id = SessionModel.user_id
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/badge/user/${user_id}`,
        })

        return data
    }

    static async changePassword(payload) {
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

    static async getUserFollowers({
        user_id,
        limit = 20,
        offset = 0,
    }) {
        // if user_id or username is not provided, set with current user
        if (!user_id && !username) {
            user_id = SessionModel.user_id
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/user/${user_id}/followers`,
            params: {
                limit,
                offset,
            }
        })

        return data
    }

    static async getConnectedUsersFollowing() {
        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: "/status/connected/following",
        })

        return data
    }
}