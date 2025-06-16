import { Playlist } from "@db_models"

export default async (id) => {
	let playlist = await Playlist.findById(id)

	if (!playlist) {
		throw new OperationError(404, "Playlist not found")
	}

	return await Playlist.findByIdAndDelete(id)
}
