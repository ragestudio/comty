import { Schematized } from "@lib"

import UpdateUserData from "../methods/updateUserData"

const AllowedPublicUpdateFields = [
    "fullName",
    "avatar",
    "email",
    "cover",
    "description",
]

const MaxStringsLengths = {
    fullName: 120,
    email: 320,
    description: 2000,
}

export default {
    method: "POST",
    route: "/self/update_data",
    middlewares: ["withAuthentication", "roles"],
    fn: Schematized({
        required: ["update"],
        select: ["update"],
    }, async (req, res) => {
        const user_id = req.user._id.toString()

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

        UpdateUserData.update({
            user_id: user_id,
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
}