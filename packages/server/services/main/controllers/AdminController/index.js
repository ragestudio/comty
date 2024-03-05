import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class AdminController extends Controller {
    static refName = "AdminController"
    static useRoute = "/admin"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}