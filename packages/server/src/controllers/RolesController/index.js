import { Role, User } from '../../models'
import { selectValues } from "../../lib"

export const RolesController = {
    get: selectValues(["user_id", "username"], async (req, res) => {
        const { user_id, username } = req.selectedValues

        if (typeof user_id !== "undefined" || typeof username !== "undefined") {
            const user = await User.findOne(req.selectedValues)
            if (!user) {
                return res.status(404).json({ error: "No user founded" })
            }
            return res.json(user.roles)
        }

        const roles = await Role.find({})

        return res.json(roles)
    }),
    set: (req, res, next) => {
        const { name, description } = req.body
        Role.findOne({ name }).then((data) => {
            if (data) {
                return res.status(409).json("This role is already created")
            }
            let document = new Role({
                name,
                description
            })
            document.save()
            return res.json(true)
        })
    }
}

export default RolesController