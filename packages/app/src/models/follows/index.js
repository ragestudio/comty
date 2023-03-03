import { SessionModel } from "models"

export default class FollowsModel {
    static async imFollowing(user_id) {
        if (!user_id) {
            throw new Error("user_id is required")
        }

        const response = await app.cores.api.customRequest( {
            method: "GET",
            url: `/follow/user/${user_id}`,
        })

        return response.data
    }

    static async getFollowers(user_id) {
        if (!user_id) {
            // set current user_id
            user_id = SessionModel.user_id
        }

        const response = await app.cores.api.customRequest( {
            method: "GET",
            url: `/follow/user/${user_id}/followers`,
        })

        return response.data
    }

    static async toogleFollow({ user_id, username }) {
        if (!user_id && !username) {
            throw new Error("user_id or username is required")
        }

        const response = await app.cores.api.customRequest( {
            method: "POST",
            url: "/follow/user/toogle",
            data: {
                user_id: user_id,
                username: username
            },
        })

        return response.data
    }
}