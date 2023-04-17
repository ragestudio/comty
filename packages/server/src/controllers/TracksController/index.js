import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class TracksController extends Controller {
    static refName = "TracksController"
    static useRoute = "/track"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}