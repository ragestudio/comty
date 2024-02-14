import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class SearchController extends Controller {
    static refName = "SearchController"
    static useRoute = "/search"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}