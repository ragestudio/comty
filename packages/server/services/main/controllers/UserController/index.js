import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class UserController extends Controller {
    static refName = "UserController"
    static useRoute = "/user"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}