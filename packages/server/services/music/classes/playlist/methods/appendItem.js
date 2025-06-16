import { Playlist } from "@db_models"

export default async (id, item) => {
	let playlist = await Playlist.findById(id).lean()

	if (!playlist) {
		throw new OperationError(404, "Playlist not found")
	}

	if (typeof item === "string" && !Array.isArray(item)) {
		item = [item]
	}

	playlist.items = [...playlist.items, ...item]

	return await Playlist.findByIdAndUpdate(id, playlist)
}
