import { Release, Playlist } from "@shared-classes/DbModels"
import DBManager from "@shared-classes/DbManager"

async function main() {
    console.log(`Running fixment move_playlist_to_release...`)

    const dbManager = new DBManager()
    await dbManager.initialize()

    const playlists = await Playlist.find({}).catch(() => false)

    console.log(`Found ${playlists.length} playlists`)

    for await (let playlist of playlists) {
        console.log(`Moving playlist ${playlist._id} to release...`)

        let data = playlist.toObject()

        let release = await Release.findOne(data).catch((err) => {
            return false
        })

        if (release) {
            console.log(`Release for playlist ${playlist._id} already exists, skipping...`)
            continue
        }

        release = new Release({
            user_id: data.user_id,
            title: data.title,
            type: "album",
            list: data.list,
            cover: data.cover,
            created_at: data.created_at ?? new Date(),
            publisher: data.publisher,
            public: data.public
        })

        console.log(`Playlist ${playlist._id} done`)

        await release.save()
    }

    console.log("Done!")
}

main()