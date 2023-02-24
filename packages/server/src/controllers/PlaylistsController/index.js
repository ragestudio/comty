import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class PlaylistsController extends Controller {
    static refName = "PlaylistsController"
    static useRoute = "/playlist"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}