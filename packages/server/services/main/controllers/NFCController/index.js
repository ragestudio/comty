import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class NFCController extends Controller {
    static refName = "NFCController"
    static useRoute = "/nfc"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")
}