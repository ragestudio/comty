import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class PublicController extends Controller {
    static refName = "PublicController"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}