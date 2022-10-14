import { Config } from "../../models"

export default (req, res, next) => {
    const requestedPath = `${req.method.toLowerCase()}${req.path.toLowerCase()}`

    Config.findOne({ key: "permissions" }, undefined, {
        lean: true,
    }).then(({ value }) => {
        req.assertedPermissions = []

        const pathRoles = value.pathRoles ?? {}

        if (typeof pathRoles[requestedPath] === "undefined") {
            console.warn(`[Permissions] No permissions defined for path ${requestedPath}`)
            return next()
        }

        const requiredRoles = Array.isArray(pathRoles[requestedPath]) ? pathRoles[requestedPath] : [pathRoles[requestedPath]]

        requiredRoles.forEach((role) => {
            if (req.user.roles.includes(role)) {
                req.assertedPermissions.push(role)
            }
        })

        if (req.user.roles.includes("admin")) {
            req.assertedPermissions.push("admin")
        }

        if (req.assertedPermissions.length === 0 && !req.user.roles.includes("admin")) {
            return res.status(403).json({
                error: "forbidden",
                message: "You don't have permission to access this resource",
            })
        }

        next()
    })
}