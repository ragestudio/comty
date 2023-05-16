import path from "path"
import fs from "fs"
import LiveDirectory from "live-directory"

function serveStaticFiles(req, res, live_dir) {
    const path = req.path.replace("/static", "")

    const asset = live_dir.get(path)

    if (!asset) {
        return res.status(404).send("Not Found")
    }

    if (asset.cached) {
        return res.send(asset.content)
    } else {
        const readable = asset.stream()

        return readable.pipe(res)
    }
}

async function serveRemoteStatic(req, res) {
    global.storage.getObject(process.env.S3_BUCKET, req.path, (err, dataStream) => {
        if (err) {
            console.log(err)
            return res.status(404).send("Not Found")
        }

        // on end of stream, dispath res.on("finish")
        dataStream.on("end", () => {
            res.emit("finish")
            return res.end()
        })

        return dataStream.pipe(res)
    })
}

async function syncFolder(dir) {
    const files = await fs.promises.readdir(dir)

    for await (const file of files) {
        const filePath = path.resolve(dir, file)

        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            await syncFolder(filePath)
        } else {
            const fileContent = await fs.promises.readFile(filePath)

            await global.storage.putObject(process.env.S3_BUCKET, filePath.replace(process.cwd(), ""), fileContent)
        }
    }
}

export default (router) => {
    const StaticDirectory = new LiveDirectory(path.resolve(process.cwd(), "static"), {
        static: true
    })

    //const static_dir = path.resolve(process.cwd(), "static")
    //syncFolder(static_dir)

    router.get("*", (req, res) => serveRemoteStatic(req, res, StaticDirectory))

    return {
        path: "/static/",
        router,
    }
}