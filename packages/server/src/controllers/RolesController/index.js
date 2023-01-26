import { Controller } from "linebridge/dist/server"
import { Role, User } from "@models"
import { Schematized } from "@lib"

export default class RolesController extends Controller {
    static refName = "RolesController"
    static useMiddlewares = ["roles"]

    httpEndpoints = {
        get: {
            "/roles": Schematized({
                select: ["user_id", "username"],
            }, async (req, res) => {
                const roles = await Role.find()

                return res.json(roles)
            }),
            "/user_roles": {
                middlewares: ["withAuthentication"],
                fn: Schematized({
                    select: ["username"],
                }, async (req, res) => {
                    const user = await User.findOne(req.selection)

                    if (!user) {
                        return res.status(404).json({ error: "No user founded" })
                    }

                    return res.json(user.roles)
                })
            },
        },

        post: {
            "/role": {
                middlewares: ["withAuthentication"],
                fn: Schematized({
                    required: ["name"],
                    select: ["name", "description"],
                }, async (req, res) => {
                    await Role.findOne(req.selection).then((data) => {
                        if (data) {
                            return res.status(409).json("This role is already created")
                        }

                        let role = new Role({
                            name: req.selection.name,
                            description: req.selection.description,
                        })

                        role.save()

                        return res.json(role)
                    })
                })
            },
            "/update_user_roles": {
                middlewares: ["withAuthentication"],
                fn: Schematized({
                    required: ["update"],
                    select: ["update"],
                }, async (req, res) => {
                    // check if issuer user is admin
                    if (!req.isAdmin()) {
                        return res.status(403).json("You do not have administrator permission")
                    }

                    if (!Array.isArray(req.selection.update)) {
                        return res.status(400).json("Invalid update request")
                    }

                    req.selection.update.forEach(async (update) => {
                        const user = await User.findById(update._id).catch(err => {
                            return false
                        })

                        console.log(update.roles)

                        if (user) {
                            user.roles = update.roles

                            await user.save()
                        }
                    })

                    return res.json("done")
                }),
            },
        },

        delete: {
            "/role": {
                middlewares: ["withAuthentication"],
                fn: Schematized({
                    required: ["name"],
                    select: ["name"],
                }, async (req, res) => {
                    if (req.selection.name === "admin") {
                        return res.status(409).json("You can't delete admin role")
                    }

                    await Role.findOne(req.selection).then((data) => {
                        if (!data) {
                            return res.status(404).json("This role is not found")
                        }

                        data.remove()

                        return res.json(data)
                    })
                })
            },
        },
    }
}