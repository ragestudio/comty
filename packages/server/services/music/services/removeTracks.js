import { Track } from "@shared-classes/DbModels"

const urlRegex = new RegExp(`^https://(.*?)/(.*)$`)

export default async (tracksIds) => {
    if (typeof tracksIds === "string") {
        tracksIds = [tracksIds]
    }

    const removedIds = []

    // find Tracks
    const tracks = await Track.find({
        _id: tracksIds,
    })

    for (const track of tracks) {
        const match = urlRegex.exec(track.source)

        const bucket = match[2].split("/")[0]
        const objectName = match[2].split("/").slice(1).join("/")

        try {
            // find on storage and remove
            await new Promise((resolve, reject) => {
                global.storage.removeObject(bucket, objectName, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve()
                })
            }).catch((err) => {
                console.error(err)
                return false
            })

            // remove from db 
            await track.remove()
        } catch (error) {
            console.error(error)
            continue
        }

        removedIds.push(track._id)
    }

    return removedIds
}