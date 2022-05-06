import { Controller } from "linebridge/dist/server"
import path from "path"
import fs from "fs"
import stream from "stream"

function resolveToUrl(filepath) {
    return `${global.globalPublicURI}/uploads/${filepath}`
}

export default class FilesController extends Controller {
    static disabled = true

    get = {
        "/uploads/:id": {
            enabled: false,
            fn: (req, res) => {
                const filePath = path.join(global.uploadPath, req.params?.id)

                const readStream = fs.createReadStream(filePath)
                const passTrough = new stream.PassThrough()

                stream.pipeline(readStream, passTrough, (err) => {
                    if (err) {
                        return res.status(400)
                    }
                })

                return passTrough.pipe(res)
            },
        }
    }

    post = {
        "/upload": {
            enabled: false,
            middlewares: ["withAuthentication", "fileUpload"],
            fn: async (req, res) => {
                const urls = []
                const failed = []

                if (!fs.existsSync(global.uploadPath)) {
                    await fs.promises.mkdir(global.uploadPath, { recursive: true })
                }

                if (req.files) {
                    for await (let file of req.files) {
                        try {
                            const filename = `${req.decodedToken.user_id}-${new Date().getTime()}-${file.filename}`

                            const diskPath = path.join(global.uploadPath, filename)

                            await fs.promises.writeFile(diskPath, file.data)

                            urls.push(resolveToUrl(filename))
                        } catch (error) {
                            console.log(error)
                            failed.push(file.filename)
                        }
                    }
                }

                return res.json({
                    urls: urls,
                    failed: failed,
                })
            }
        }
    }
}