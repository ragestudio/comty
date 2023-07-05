global.toBoolean = (value) => {
    if (typeof value === "boolean") {
        return value
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true"
    }

    return false
}

import DbManager from "../src/shared-classes/DbManager"
import StorageClient from "../src/shared-classes/StorageClient"

import audioProcess from "../src/services/post-process/audio"

import { Track } from "../../music_server/src/models"

import axios from "axios"
import fs from "fs"
import path from "path"
import pMap from "p-map"

const tmpPath = path.resolve(__dirname, ".tmp")

let index = 0
let tracksLength = 0

async function recalculateMetadata(track) {
    console.log(`\n`)
    console.time(`recalculation ${track._id}`)
    console.log(`Recalculating metadata for ${track._id}`)

    // parse url https://domain/buket/file and fetch buket and file
    const regex = new RegExp(`^https://(.*?)/(.*)$`)

    const match = regex.exec(track.source)

    const objectName = match[2].split("/").slice(1).join("/")

    const filePath = path.resolve(tmpPath, objectName)

    try {
        if (!track.metadata) {
            console.time(`fetching ${track._id}`)
            // storage obj on memory 
            let file = await axios.get(track.source, {
                responseType: "stream",
            })

            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { recursive: true })
            }

            // write file to tmpPath
            const fileWriter = fs.createWriteStream(filePath)

            file.data.pipe(fileWriter)

            await new Promise((resolve, reject) => {
                fileWriter.on("finish", resolve)
                fileWriter.on("error", reject)
            })
            console.timeEnd(`fetching ${track._id}`)

            console.time(`processing ${track._id}`)
            file = await audioProcess({
                filepath: filePath
            })
            track.metadata = file.metadata

            if (!track.publisher) {
                track.publisher = {}
            }
            await track.save()
            await fs.promises.unlink(filePath)

            console.timeEnd(`processing ${track._id}`)

            console.log(`Updated metadata for ${track._id}`, track.metadata)
        } else {
            console.log(`Metadata already exists for ${track._id}, skipping...`)
        }
    } catch (error) {
        console.error(error)

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath)
        }
    }

    index++

    console.timeEnd(`recalculation ${track._id}`)
    console.log(`Metadata done [${index}/${tracksLength}]`)
}

async function main() {
    console.time("fix audio metadata")

    const db = new DbManager()
    const storage = StorageClient()

    await db.initialize()
    await storage.initialize()

    console.log(`Finding tracks...`)

    console.time("finding tracks")

    let tracks = await Track.find({
        source: {
            $exists: true,
        },
    })

    tracksLength = tracks.length

    console.timeEnd("finding tracks")

    console.log(`Found ${tracks.length} tracks.`)

    console.log(`Starting fix...\n`)

    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath)
    }

    await pMap(tracks, recalculateMetadata, {
        concurrency: 3,
    })

    console.timeEnd("fix audio metadata")
    console.log("Done!")

    process.on("exit", () => {
        console.log("Exiting...")
        fs.promises.rmdir(tmpPath, { recursive: true })
    })

    process.exit(0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})