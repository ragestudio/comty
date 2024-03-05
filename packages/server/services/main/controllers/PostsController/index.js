import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class PostsController extends Controller {
    static refName = "PostsController"
    static useRoute = "/posts"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")

    // put = {
    //     "/:post_id": {
    //         middlewares: ["withAuthentication"],
    //         fn: (req, res) => {
    //             // TODO: Implement Post update
    //             return res.status(501).json({ error: "Not implemented" })
    //         }
    //     }
    // }
}