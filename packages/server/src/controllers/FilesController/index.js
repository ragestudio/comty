import { Controller } from "linebridge/dist/server"

import uploadBodyFiles from "./services/uploadBodyFiles"

export default class FilesController extends Controller {
    static refName = "FilesController"
    static useRoute = "/files"

    httpEndpoints = {
        get: {
            "/objects": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user.id

                    let totalSize = 0

                    const objectsPath = `${user_id}/`

                    const objects = await new Promise((resolve, reject) => {
                        const objects = []

                        const objectsStream = global.storage.listObjects(global.storage.defaultBucket, objectsPath, true)

                        objectsStream.on("data", (obj) => {
                            objects.push(obj)
                        })

                        objectsStream.on("error", (err) => {
                            return reject(err)
                        })

                        objectsStream.on("end", () => {
                            return resolve(objects)
                        })
                    })

                    for await (const object of objects) {
                        totalSize += object.size
                    }

                    return res.json({
                        totalSize,
                        objects,
                    })
                }
            }
        },
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