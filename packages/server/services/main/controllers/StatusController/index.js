import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class StatusController extends Controller {
    static refName = "StatusController"
    static useRoute = "/status"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}