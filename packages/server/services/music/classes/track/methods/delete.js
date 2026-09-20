import Track from "@db_models/track"

export default async (track_id) => {
	if (!track_id) {
		throw new OperationError(400, "Missing track_id")
	}

	return await Track.findOneAndDelete({ _id: track_id })
}
