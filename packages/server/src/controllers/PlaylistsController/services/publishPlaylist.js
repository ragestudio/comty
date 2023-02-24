import { Playlist } from "@models"

export default async (payload) => {
    const { user_id, title, description, thumbnail, list } = payload

    if (!title) {
        throw new Error("Title is required")
    }

    if (!Array.isArray(list)) {
        throw new Error("list is not an array")
    }

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