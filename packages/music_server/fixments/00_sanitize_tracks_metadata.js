import DbManager from "../src/shared-classes/DbManager"
import { Track } from "../src/models"

async function main() {
    const db = new DbManager()

    await db.initialize()

    console.log(`Finding tracks...`)

    console.time("finding tracks")
    const tracksWithMetadata = await Track.find({
        metadata: {
            $exists: true,
        },
    })
    console.timeEnd("finding tracks")

    console.log(`Found ${tracksWithMetadata.length} tracks with metadata.`)

    console.time("removing metadata")

    for (const track of tracksWithMetadata) {
        console.time(`removing metadata for ${track._id}`)
        await Track.findByIdAndUpdate(track._id, {
            $unset: {
                metadata: "",
            },
        })
        console.timeEnd(`removing metadata for ${track._id}`)
    }

    console.timeEnd("removing metadata")

    console.log("Done!")

    process.exit(0)
}

main().catch(console.error)