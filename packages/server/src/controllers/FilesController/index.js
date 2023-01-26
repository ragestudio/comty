import { Controller } from "linebridge/dist/server"

import uploadBodyFiles from "./services/uploadBodyFiles"

export default class FilesController extends Controller {
    static refName = "FilesController"

    httpEndpoints = {
        post: {
            "/upload": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const results = await uploadBodyFiles({
                        req,
                    }).catch((err) => {
                        res.status(400).json({
                            error: err.message,
                        })

                        return false
                    })

                    if (results) {
                        return res.json(results)
                    }
                }
            }
        }
    }
}