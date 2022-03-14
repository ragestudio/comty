import { ComplexController } from "linebridge/dist/classes"
import passport from "passport"

import { User } from "../../models"
import { Token, Schematized, createUser } from "../../lib"
import SessionController from "../SessionController"
import _ from "lodash"

const AllowedUserUpdateKeys = [
    "avatar",
    "username",
    "email",
    "fullName",
    "verified",
]

export default class UserController extends ComplexController {
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
                if (!AllowedUserUpdateKeys.includes(key)) {
                    return false
                }

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
        }
    }

    get = {
        "/self": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                return res.json(req.user)
            },
        },
        "/user": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["_id", "username"],
            }, async (req, res) => {
                const user = await User.findOne(req.selection)

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

                this.methods.update({
                    user_id: req.selection.user_id,
                    update: req.selection.update,
                }).then((user) => {
                    return res.json({
                        ...user
                    })
                })
                    .catch((err) => {
                        return res.send(500).json({
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
                        return res.send(500).json({
                            error: err.message
                        })
                    })
            })
        }
    }
}