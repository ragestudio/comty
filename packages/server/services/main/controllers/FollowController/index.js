import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class FollowController extends Controller {
    static refName = "FollowController"
    static useRoute = "/follow"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}