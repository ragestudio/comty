import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class SessionController extends Controller {
    static refName = "SessionController"
    static useRoute = "/session"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}