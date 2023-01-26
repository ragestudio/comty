import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class BadgesController extends Controller {
    static refName = "BadgesController"
    static useRoute = "/badge"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}