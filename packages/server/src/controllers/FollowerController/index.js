import { Controller } from "linebridge/dist/server"

import { User, UserFollow } from "../../models"
import { Schematized } from "../../lib"

export default class FollowerController extends Controller {
    methods = {
        follow: async (payload) => {
            if (typeof payload.user_id === "undefined") {
                throw new Error("No user_id provided")
            }
            if (typeof payload.to === "undefined") {
                throw new Error("No to provided")
            }

            const user = await User.findById(payload.user_id)

            if (!user) {
                throw new Error("User not found")
            }

            const follow = await UserFollow.findOne({
                user_id: payload.user_id,
                to: payload.to,
            })

            if (follow) {
                throw new Error("Already following")
            }

            const newFollow = await UserFollow.create({
                user_id: payload.user_id,
                to: payload.to,
            })

            await newFollow.save()

            global.wsInterface.io.emit(`user.follow`, {
                ...user.toObject(),
            })
            global.wsInterface.io.emit(`user.follow.${payload.user_id}`, {
                ...user.toObject(),
            })

            const followers = await UserFollow.find({
                to: payload.to,
            })

            return {
                following: true,
                followers: followers,
            }
        },
        unfollow: async (payload) => {
            if (typeof payload.user_id === "undefined") {
                throw new Error("No user_id provided")
            }
            if (typeof payload.to === "undefined") {
                throw new Error("No to provided")
            }

            const user = await User.findById(payload.user_id)

            if (!user) {
                throw new Error("User not found")
            }

            const follow = await UserFollow.findOne({
                user_id: payload.user_id,
                to: payload.to,
            })

            if (!follow) {
                throw new Error("Not following")
            }

            await follow.remove()

            global.wsInterface.io.emit(`user.unfollow`, {
                ...user.toObject(),
            })
            global.wsInterface.io.emit(`user.unfollow.${payload.user_id}`, {
                ...user.toObject(),
            })

            const followers = await UserFollow.find({
                to: payload.to,
            })

            return {
                following: false,
                followers: followers,
            }
        },
    }

    post = {
        "/follow_user": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["user_id", "username"],
            }, async (req, res) => {
                const selfUserId = req.user._id.toString()
                let targetUserId = null
                let result = null

                if (typeof req.selection.user_id === "undefined" && typeof req.selection.username === "undefined") {
                    return res.status(400).json({ message: "No user_id or username provided" })
                }

                if (typeof req.selection.user_id !== "undefined") {
                    targetUserId = req.selection.user_id
                } else {
                    const user = await User.findOne({ username: req.selection.username })

                    if (!user) {
                        return res.status(404).json({ message: "User not found" })
                    }

                    targetUserId = user._id.toString()
                }

                // check if already following
                const isFollowed = await UserFollow.findOne({
                    user_id: selfUserId,
                    to: targetUserId,
                })

                // if already following, delete
                if (isFollowed) {
                    result = await this.methods.unfollow({
                        user_id: selfUserId,
                        to: targetUserId,
                    }).catch((error) => {
                        return res.status(500).json({ message: error.message })
                    })
                } else {
                    result = await this.methods.follow({
                        user_id: selfUserId,
                        to: targetUserId,
                    }).catch((error) => {
                        return res.status(500).json({ message: error.message })
                    })
                }

                return res.json(result)
            })
        }
    }

    get = {
        "/user/:user_id/followers": async (req, res) => {
            const { limit = 30, offset } = req.query

            let followers = []

            const follows = await UserFollow.find({
                to: req.params.user_id,
            })
                .limit(limit)
                .skip(offset)

            for await (const follow of follows) {
                const user = await User.findById(follow.user_id)

                if (!user) {
                    continue
                }

                followers.push(user.toObject())
            }

            return res.json(followers)
        },
        "/followers": Schematized({
            required: ["user_id"],
            select: ["user_id"],
        }, async (req, res) => {
            let followers = []
            const follows = await UserFollow.find({
                to: req.selection.user_id,
            })

            for await (const follow of follows) {
                const user = await User.findById(follow.user_id)

                if (!user) {
                    continue
                }

                followers.push(user.toObject())
            }

            return res.json(followers)
        }),
        "/is_followed": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["user_id"],
                select: ["user_id"]
            }, async (req, res) => {
                const isFollowed = await UserFollow.findOne({
                    user_id: req.user._id.toString(),
                    to: req.selection.user_id,
                }).catch(() => false)

                return res.json({
                    isFollowed: Boolean(isFollowed),
                })
            }),
        },
    }
}