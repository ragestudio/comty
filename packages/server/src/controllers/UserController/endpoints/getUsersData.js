import { Schematized } from "@lib"
import { User } from "@models"

export default {
    method: "GET",
    route: "/users/data",
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
}