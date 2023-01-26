import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class CommentsController extends Controller {
    static refName = "CommentsController"
    static useRoute = "/comments"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}