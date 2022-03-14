import { ComplexController } from "linebridge/dist/classes"

export default class PublicController extends ComplexController {
    static refName = "PublicController"

    post = {
        "/only_managers_test": {
            middlewares: ["withAuthentication", "permissions"],
            fn: (req, res) => {
                return res.json({
                    message: "Congrats!, Only managers can access this route (or you are an admin)",
                    assertedPermissions: req.assertedPermissions
                })
            },
        }
    }
}