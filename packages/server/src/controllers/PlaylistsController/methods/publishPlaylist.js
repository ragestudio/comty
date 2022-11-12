import { Playlist } from "../../../models"

export default async (payload) => {
    const { user_id, title, description, thumbnail, list } = payload

    const playlist = new Playlist({
        user_id,
        created_at: Date.now(),
        title: title ?? "Untitled",
        description,
        thumbnail,
        list,
    })

    await playlist.save()

    global.eventBus.emit("playlist.created", playlist)

    return playlist
}