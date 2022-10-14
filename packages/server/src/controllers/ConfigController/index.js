import { Controller } from "linebridge/dist/server"

export default class ConfigController extends Controller {
    static refName = "ConfigController"
    static useMiddlewares = ["withAuthentication", "onlyAdmin"]

    post = {
        "/update_config": async (req, res) => {

        },
    }
}