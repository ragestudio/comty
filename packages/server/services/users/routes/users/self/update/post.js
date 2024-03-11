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
        let { update } = req.body

        if (!update) {
            throw new OperationError(400, "Missing update")
        }

        if (typeof update === "string") {
            update = JSON.parse(update)
        }

        // sanitize update
        AllowedPublicUpdateFields.forEach((key) => {
            if (typeof update[key] !== "undefined") {
                // check maximung strings length
                if (typeof update[key] === "string" && MaxStringsLengths[key]) {
                    if (update[key].length > MaxStringsLengths[key]) {
                        // create a substring
                        update[key] = update[key].substring(0, MaxStringsLengths[key])
                    }
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

        return await UserClass.update({
            user_id: req.auth.session.user_id,
            update: update,
        })
    }
}