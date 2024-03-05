import { Controller } from "linebridge/src/server"
import generateEndpointsFromDir from "linebridge/src/server/lib/generateEndpointsFromDir"

export default class PublicController extends Controller {
    static refName = "PublicController"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}