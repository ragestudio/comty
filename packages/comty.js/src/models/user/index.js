import SessionModel from "../session"
import request from "../../handlers/request"

export default class User {
    static data = async (payload = {}) => {
        let {
            username,
            user_id,
        } = payload

        if (!username && !user_id) {
            user_id = SessionModel.user_id
        }

        if (username && !user_id) {
            // resolve user_id from username
            const resolveResponse = await request({
                method: "GET",
                url: `/user/user_id/${username}`,
            })

            user_id = resolveResponse.data.user_id
        }

        const response = await request({
            method: "GET",
            url: `/user/${user_id}/data`,
        })

        return response.data
    }

    static updateData = async (payload) => {
        const response = await request({
            method: "POST",
            url: "/user/self/update_data",
            data: {
                update: payload,
            },
        })

        return response.data
    }

    static unsetFullName = async () => {
        const response = await request({
            method: "DELETE",
            url: "/user/self/public_name",
        })

        return response.data
    }

    static selfRoles = async () => {
        const response = await request({
            method: "GET",
            url: "/roles/self",
        })

        return response.data
    }

    static haveRole = async (role) => {
        const roles = await User.selfRoles()

        if (!roles) {
            return false
        }

        return Array.isArray(roles) && roles.includes(role)
    }

    static haveAdmin = async () => {
        return User.haveRole("admin")
    }

    static getUserBadges = async (user_id) => {
        if (!user_id) {
            user_id = SessionModel.user_id
        }

        const { data } = await request({
            method: "GET",
            url: `/badge/user/${user_id}`,
        })

        return data
    }

    static changePassword = async (payload) => {
        const { currentPassword, newPassword } = payload

        const { data } = await request({
            method: "POST",
            url: "/user/self/update_password",
            data: {
                currentPassword,
                newPassword,
            }
        })

        return data
    }

    static getUserFollowers = async ({
        user_id,
        limit = 20,
        offset = 0,
    }) => {
        // if user_id or username is not provided, set with current user
        if (!user_id && !username) {
            user_id = SessionModel.user_id
        }

        const { data } = await request({
            method: "GET",
            url: `/user/${user_id}/followers`,
            params: {
                limit,
                offset,
            }
        })

        return data
    }

    static getConnectedUsersFollowing = async () => {
        const { data } = await request({
            method: "GET",
            url: "/status/connected/following",
        })

        return data
    }

    static checkUsernameAvailability = async (username) => {
        const { data } = await request({
            method: "GET",
            url: `/user/username_available`,
            params: {
                username,
            }
        })

        return data
    }

    static checkEmailAvailability = async (email) => {
        const { data } = await request({
            method: "GET",
            url: `/user/email_available`,
            params: {
                email,
            }
        })

        return data
    }
}