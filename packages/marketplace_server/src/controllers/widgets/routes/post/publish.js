import sevenzip from "7zip-min"
import busboy from "busboy"
import fs from "fs"
import path from "path"

import syncFolder from "@utils/syncDirToRemote"

import { Widget } from "@models"

const tmpPath = path.join(process.cwd(), ".tmp")

function extractBundle(input, output) {
    return new Promise((resolve, reject) => {
        sevenzip.unpack(input, output, async (err) => {
            if (err) {
                reject(err)
            } else {
                await fs.promises.rm(input, { recursive: true, force: true })

                console.log("Bundle extracted")

                return resolve()
            }
        })
    })
}

function writeBundleFile(file, output) {
    return new Promise((resolve, reject) => {
        file.pipe(fs.createWriteStream(output))

        file.on("end", () => {
            // FIXME: somehow, sometimes files are not completely written causing extraction to fail
            setTimeout(resolve, 100)
        })

        file.on("error", (error) => {
            reject(error)
        })
    })
}

export default async function (req, res) {
    // extract authentification header
    let auth = req.session

    if (!auth) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    // get bundle file
    const bb = busboy({ headers: req.headers })

    const workPath = path.join(tmpPath, global.nanoid())
    const bundlePath = path.join(tmpPath, `${global.nanoid()}.7z`)

    bb.on("file", async (fieldName, file, info) => {
        try {
            if (!fs.existsSync(workPath)) {
                fs.mkdirSync(workPath, { recursive: true })
            }

            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath, { recursive: true })
            }

            await writeBundleFile(file, bundlePath)
            await extractBundle(bundlePath, workPath)

            // read manifest.json
            const manifestPath = path.join(workPath, "manifest.json")

            if (!fs.existsSync(manifestPath)) {
                throw new Error("manifest.json not found")
            }

            let manifest = null

            try {
                manifest = JSON.parse(fs.readFileSync(manifestPath))
            } catch (error) {
                throw new Error("Cannot parse manifest.json")
            }

            if (!manifest.main) {
                throw new Error("manifest has not main field")
            }

            // check if main file exists
            const mainPath = path.join(workPath, manifest.main)

            if (!fs.existsSync(mainPath)) {
                throw new Error("main file not found")
            }

            const findQuery = {
                user_id: auth.user_id,
                "manifest.name": manifest.name,
            }

            let widget = await Widget.findOne(findQuery)

            if (!widget) {
                widget = new Widget({
                    user_id: auth.user_id,
                    manifest,
                })

                await widget.save()
            }

            const destPath = `/widgets/${widget._id.toString()}@${manifest.version}`

            if (manifest.icon) {
                manifest.icon = global.storage.composeRemoteURL(path.join(destPath, manifest.icon))
            }

            widget = await Widget.findOneAndUpdate(findQuery, {
                $set: {
                    manifest,
                }
            }, {
                new: true
            })

            // upload to remote storage
            await syncFolder(workPath, destPath)

            // remove tmp folder
            await fs.promises.rm(workPath, { recursive: true, force: true })

            return res.json(widget)
        } catch (error) {
            await fs.promises.rm(workPath, { recursive: true, force: true })
            await fs.promises.rm(bundlePath, { recursive: true, force: true })

            return res.status(500).json({ error: error.message })
        }
    })

    return req.pipe(bb)
}