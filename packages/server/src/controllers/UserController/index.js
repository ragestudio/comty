import { Controller } from "linebridge/dist/server"
import passport from "passport"
import { User, UserFollow } from "../../models"
import { Token, Schematized, createUser } from "../../lib"
import SessionController from "../SessionController"
import _ from "lodash"

const AllowedPublicUpdateFields = [
    "fullName",
    "avatar",
    "email",
    "cover",
    "description",
]

const AllowedAnonPublicGetters = [
    "username",
    "fullName",
    "avatar",
    "roles"
]

const MaxStringsLengths = {
    fullName: 120,
    email: 320,
    description: 2000,
}

export default class UserController extends Controller {
    static refName = "UserController"

    methods = {
        createNew: async (payload) => {
            const user = await createUser(payload)

            // maybe for the future can implement a event listener for this

            return user
        },
        update: async (payload) => {
            if (typeof payload.user_id === "undefined") {
                throw new Error("No user_id provided")
            }
            if (typeof payload.update === "undefined") {
                throw new Error("No update provided")
            }

            let user = await User.findById(payload.user_id)

            if (!user) {
                throw new Error("User not found")
            }

            const updateKeys = Object.keys(payload.update)

            updateKeys.forEach((key) => {
                user[key] = payload.update[key]
            })

            await user.save()

            global.wsInterface.io.emit(`user.update`, {
                ...user.toObject(),
            })
            global.wsInterface.io.emit(`user.update.${payload.user_id}`, {
                ...user.toObject(),
            })

            return user.toObject()
        },
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

    get = {
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
        "/user/public_data": {
            middlewares: ["withOptionalAuthentication"],
            fn: async (req, res) => {
                let user = req.query?.username ?? req.user.username

                if (!user) {
                    return res.status(400).json({
                        error: "No user provided",
                    })
                }

                user = await User.findOne({
                    username: user,
                }).catch(() => null)

                if (!user) {
                    return res.json({
                        user: null,
                    })
                }

                user = _.pick(user, AllowedAnonPublicGetters)

                return res.json(user)
            }
        },
        "/self": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                return res.json(req.user)
            },
        },
        "/user/username-available": async (req, res) => {
            const user = await User.findOne({
                username: req.query.username,
            })

            return res.json({
                available: !user,
            })
        },
        "/user/email-available": async (req, res) => {
            const user = await User.findOne({
                email: req.query.email,
            })

            return res.json({
                available: !user,
            })
        },
        "/user": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["_id", "username"],
            }, async (req, res) => {
                let user = await User.findOne(req.selection)

                if (!user) {
                    return res.status(404).json({ error: "User not exists" })
                }

                return res.json(user)
            }),
        },
        "/users": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["_id", "username"],
            }, async (req, res) => {
                let result = []
                let selectQueryKeys = []

                if (Array.isArray(req.selection._id)) {
                    for await (let _id of req.selection._id) {
                        const user = await User.findById(_id).catch(err => {
                            return false
                        })
                        if (user) {
                            result.push(user)
                        }
                    }
                } else {
                    result = await User.find(req.selection, { username: 1, fullName: 1, _id: 1, roles: 1, avatar: 1 })
                }

                if (req.query?.select) {
                    try {
                        req.query.select = JSON.parse(req.query.select)
                    } catch (error) {
                        req.query.select = {}
                    }

                    selectQueryKeys = Object.keys(req.query.select)
                }

                if (selectQueryKeys.length > 0) {
                    result = result.filter(user => {
                        let pass = false
                        const selectFilter = req.query.select

                        selectQueryKeys.forEach(key => {
                            if (Array.isArray(selectFilter[key]) && Array.isArray(user[key])) {
                                // check if arrays includes any of the values
                                pass = selectFilter[key].some(val => user[key].includes(val))
                            } else if (typeof selectFilter[key] === "object" && typeof user[key] === "object") {
                                // check if objects includes any of the values
                                Object.keys(selectFilter[key]).forEach(objKey => {
                                    pass = user[key][objKey] === selectFilter[key][objKey]
                                })
                            }

                            // check if strings includes any of the values
                            if (typeof selectFilter[key] === "string" && typeof user[key] === "string") {
                                pass = selectFilter[key].split(",").some(val => user[key].includes(val))
                            }
                        })

                        return pass
                    })
                }

                if (!result) {
                    return res.status(404).json({ error: "Users not found" })
                }

                return res.json(result)
            })
        },
    }

    put = {
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

    post = {
        "/login": async (req, res) => {
            passport.authenticate("local", { session: false }, async (error, user, options) => {
                if (error) {
                    return res.status(500).json(`Error validating user > ${error.message}`)
                }

                if (!user) {
                    return res.status(401).json("Invalid credentials")
                }

                const token = await Token.createNewAuthToken(user, options)

                return res.json({ token: token })
            })(req, res)
        },
        "/logout": {
            middlewares: ["withAuthentication"],
            fn: async (req, res, next) => {
                req.body = {
                    user_id: req.decodedToken.user_id,
                    token: req.jwtToken
                }

                return SessionController.delete(req, res, next)
            },
        },
        "/register": Schematized({
            required: ["username", "email", "password"],
            select: ["username", "email", "password", "fullName"],
        }, async (req, res) => {
            const result = await this.methods.createNew(req.selection).catch((err) => {
                return res.status(500).json(err.message)
            })

            return res.json(result)
        }),
        "/update_user": {
            middlewares: ["withAuthentication", "roles"],
            fn: Schematized({
                required: ["_id", "update"],
                select: ["_id", "update"],
            }, async (req, res) => {
                if (!req.selection.user_id) {
                    req.selection.user_id = req.user._id.toString()
                }

                if ((req.selection.user_id !== req.user._id.toString()) && (req.hasRole("admin") === false)) {
                    return res.status(403).json({ error: "You are not allowed to update this user" })
                }

                let update = {}

                AllowedPublicUpdateFields.forEach((key) => {
                    if (typeof req.selection.update[key] !== "undefined") {
                        // sanitize update
                        // check maximung strings length
                        if (typeof req.selection.update[key] === "string" && MaxStringsLengths[key]) {
                            if (req.selection.update[key].length > MaxStringsLengths[key]) {
                                // create a substring
                                req.selection.update[key] = req.selection.update[key].substring(0, MaxStringsLengths[key])
                            }
                        }

                        update[key] = req.selection.update[key]
                    }
                })

                this.methods.update({
                    user_id: req.selection.user_id,
                    update: update,
                }).then((user) => {
                    return res.json({
                        ...user
                    })
                })
                    .catch((err) => {
                        return res.json(500).json({
                            error: err.message
                        })
                    })
            }),
        },
        "/unset_public_name": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["user_id", "roles"],
            }, async (req, res) => {
                if (!req.selection.user_id) {
                    req.selection.user_id = req.user._id.toString()
                }

                if ((req.selection.user_id !== req.user._id.toString()) && (req.hasRole("admin") === false)) {
                    return res.status(403).json({ error: "You are not allowed to update this user" })
                }

                this.methods.update({
                    user_id: req.selection.user_id,
                    update: {
                        fullName: undefined
                    }
                }).then((user) => {
                    return res.json({
                        ...user
                    })
                })
                    .catch((err) => {
                        return res.json(500).json({
                            error: err.message
                        })
                    })
            })
        }
    }
}