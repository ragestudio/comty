import { SessionModel } from "../../models"
import request from "../../handlers/request"

export default class FollowsModel {
    static imFollowing = async (user_id) => {
        if (!user_id) {
            throw new Error("user_id is required")
        }

        const response = await request({
            method: "GET",
            url: `/follow/user/${user_id}`,
        })

        return response.data
    }

    static getFollowers = async (user_id) => {
        if (!user_id) {
            // set current user_id
            user_id = SessionModel.user_id
        }

        const response = await request({
            method: "GET",
            url: `/follow/user/${user_id}/followers`,
        })

        return response.data
    }

    static toggleFollow = async ({ user_id, username }) => {
        if (!user_id && !username) {
            throw new Error("user_id or username is required")
        }

        const response = await request({
            method: "POST",
            url: "/follow/user/toggle",
            data: {
                user_id: user_id,
                username: username
            },
        })

        return response.data
    }
}