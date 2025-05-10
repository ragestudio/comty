import DbManager from "@shared-classes/DbManager"
import { TrackLike, MusicLibraryItem } from "@db_models"

async function main() {
	await global.injectEnvFromInfisical()

	const db = new DbManager()
	await db.initialize()

	if (!TrackLike) {
		console.log("TrackLike model not found, skipping migration.")
		return null
	}

	if (!MusicLibraryItem) {
		console.log("MusicLibraryItem model not found, skipping migration.")
		return null
	}

	// find all liked tracks
	const likedTracks = await TrackLike.find()
	const totalLikedTracks = await TrackLike.countDocuments()

	for await (const likedTrack of likedTracks) {
		// first check if already exist a library item for this track like
		let libraryItem = await MusicLibraryItem.findOne({
			user_id: likedTrack.user_id,
			item_id: likedTrack.track_id,
			kind: "tracks",
		})

		if (!libraryItem) {
			console.log(
				`Migrating [${likedTrack._id.toString()}] track like to library item...`,
			)
			// if not exist, create a new one
			libraryItem = new MusicLibraryItem({
				user_id: likedTrack.user_id,
				item_id: likedTrack.track_id,
				kind: "tracks",
				created_at: likedTrack.created_at ?? new Date(),
			})

			await libraryItem.save()
		}
	}

	console.log({
		totalLikedTracks,
	})
}

main()
