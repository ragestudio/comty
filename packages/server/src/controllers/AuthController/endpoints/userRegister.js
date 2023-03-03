import { Schematized } from "@lib"

import createUser from "../methods/createUser"

export default {
    method: "POST",
    route: "/register",
    fn: Schematized({
        required: ["username", "email", "password"],
        select: ["username", "email", "password", "fullName"],
    }, async (req, res) => {
        const result = await createUser(req.selection).catch((err) => {
            return res.status(500).json(err.message)
        })

        return res.json(result)
    })
}