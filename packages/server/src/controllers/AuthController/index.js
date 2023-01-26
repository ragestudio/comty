import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class AuthController extends Controller {
    static refName = "AuthController"
    static useRoute = "/auth"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}