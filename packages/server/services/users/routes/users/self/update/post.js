import UserClass from "@classes/users"
import { User } from "@db_models"

const AllowedPublicUpdateFields = [
    "public_name",
    "avatar",
    "email",
    "cover",
    "description",
    "location",
    "links",
    "birthday",
]

const MaxStringsLengths = {
    public_name: 120,
    email: 320,
    description: 320,
}

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const update = {}

        // sanitize update
        AllowedPublicUpdateFields.forEach((key) => {
            if (typeof req.body[key] !== "undefined") {
                // check maximung strings length
                if (typeof req.body[key] === "string" && MaxStringsLengths[key]) {
                    if (req.body[key].length > MaxStringsLengths[key]) {
                        // create a substring
                        update[key] = req.body[key].substring(0, MaxStringsLengths[key])
                    } else {
                        update[key] = req.body[key]
                    }
                } else {
                    update[key] = req.body[key]
                }
            }
        })

        if (typeof update.email !== "undefined") {
            const user = await User.findOne({
                email: update.email,
            }).catch((err) => {
                return false
            })

            if (user) {
                throw new OperationError(400, "Email is already in use")
            }
        }

        return await UserClass.update(req.auth.session.user_id, update)
    }
}