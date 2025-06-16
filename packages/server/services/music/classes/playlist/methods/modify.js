import { Playlist } from "@db_models"

export default async (id, update) => {
	let playlist = await Playlist.findById(id).lean()

	if (!playlist) {
		throw new OperationError(404, "Playlist not found")
	}

	playlist = {
		...playlist,
		...update,
	}

	return await Playlist.findByIdAndUpdate(id, playlist)
}
