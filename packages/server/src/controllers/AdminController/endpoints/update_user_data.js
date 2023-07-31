import { User } from "@shared-classes/DbModels"

export default {
    method: "POST",
    route: "/update_data/:user_id",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req, res) => {
        const targetUserId = req.params.user_id

        const user = await User.findById(targetUserId).catch((err) => {
            return false
        })

        if (!user) {
            return res.status(404).json({ error: "No user founded" })
        }

        const updateKeys = Object.keys(req.body.update)

        updateKeys.forEach((key) => {
            user[key] = req.body.update[key]
        })

        await user.save()

        global.websocket_instance.io.emit(`user.update`, {
            ...user.toObject(),
        })
        global.websocket_instance.io.emit(`user.update.${targetUserId}`, {
            ...user.toObject(),
        })

        return res.json(user.toObject())
    }
}