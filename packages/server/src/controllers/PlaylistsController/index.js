import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

export default class PlaylistsController extends Controller {
    //static useMiddlewares = ["withAuthentication"]

    get = {
        "/playlist/:id": async (req, res) => {

        }
    }

    post = {
        "/playlist/publish": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                
            }
        }
    }
}