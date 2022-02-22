import { ComplexController } from "linebridge/dist/classes"

export default class ConfigController extends ComplexController {
    static refName = "ConfigController"
    static useMiddlewares = ["withAuthentication", "onlyAdmin"]

    post = {
        "/update_config": async (req, res) => {

        },
    }
}