import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class ModerationController extends Controller {
    static refName = "ModerationController"
    static useRoute = "/mod"
    static reachable = false

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}