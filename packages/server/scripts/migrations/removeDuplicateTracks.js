import DbManager from "@shared-classes/DbManager"
import { Track } from "@db_models"
import axios from "axios"

async function main() {
	await global.injectEnvFromInfisical()

	const db = new DbManager()
	await db.initialize()

	// try to parse some queries from argv
	let fromTime = process.argv.find((arg) => arg.startsWith("--fromTime="))

	if (fromTime) {
		fromTime = fromTime.replace("--fromTime=", "")
		console.log(`Searching from time: ${fromTime}`, new Date(fromTime))
	}

	let query = {}

	if (fromTime) {
		query = {
			created_at: {
				$gte: new Date(fromTime),
			},
		}
	}

	const tracks = await Track.find(query)

	console.log(`Total tracks in database: ${tracks.length}`)

	// Group tracks by ETag
	const tracksByETag = new Map()

	for (const track of tracks) {
		if (
			!track.source ||
			typeof track.source !== "string" ||
			!track.source.startsWith("http")
		) {
			console.warn(
				`Skipping track ID ${track._id} due to invalid or missing source URL: "${track.source}"`,
			)
			continue
		}

		const index = tracks.indexOf(track)

		try {
			console.log(
				`[${index + 1}/${tracks.length}] Fetching ETag for source: ${track.source} (Track ID: ${track._id})`,
			)

			const response = await axios.head(track.source, {
				timeout: 10000, // 10 seconds timeout
				headers: {
					Accept: "*/*",
					"Accept-Encoding": "gzip, deflate, br",
					Connection: "keep-alive",
				},
			})

			// ETag header can be 'etag' or 'ETag' (case-insensitive)
			const etag = response.headers["etag"] || response.headers["ETag"]

			if (etag) {
				if (!tracksByETag.has(etag)) {
					tracksByETag.set(etag, [])
				}
				tracksByETag.get(etag).push(track)
			} else {
				console.warn(
					`  No ETag found for source: ${track.source} (Track ID: ${track._id})`,
				)
			}
		} catch (error) {
			let errorMessage = error.message

			if (error.response) {
				errorMessage = `Server responded with status ${error.response.status} ${error.response.statusText}`
			} else if (error.request) {
				errorMessage =
					"No response received from server (e.g., timeout, network error)"
			}

			console.error(
				`Error fetching ETag for ${track.source} (Track ID: ${track._id}): ${errorMessage}`,
			)
		}
	}

	console.log(
		`Finished fetching ETags. Found ${tracksByETag.size} unique ETags.`,
	)

	// Process groups to find and delete duplicates
	let deletedCount = 0

	for (const [etag, tracksForETag] of tracksByETag.entries()) {
		if (tracksForETag.length > 1) {
			console.log(
				`Found ${tracksForETag.length} tracks for ETag: "${etag}"`,
			)

			// Sort tracks by _id (lexicographically largest first - assuming larger _id is newer)
			// This ensures that we consistently pick the same track to keep if ETags are identical.
			tracksForETag.sort((a, b) =>
				b._id.toString().localeCompare(a._id.toString()),
			)

			const trackToKeep = tracksForETag[0]
			const tracksToDelete = tracksForETag.slice(1)

			if (tracksToDelete.length > 0) {
				const idsToDelete = tracksToDelete.map((track) => track._id)

				console.log(
					`Keeping Track ID: ${trackToKeep._id} (Source: ${trackToKeep.source}) - selected due to largest _id (assumed newer).`,
				)
				tracksToDelete.forEach((t) => {
					console.log(
						`Marking for deletion: Track ID: ${t._id} (Source: ${t.source})`,
					)
				})
				console.log(
					`Attempting to delete ${idsToDelete.length} duplicate tracks for ETag: "${etag}"`,
				)

				try {
					const deleteResult = await Track.deleteMany({
						_id: { $in: idsToDelete },
					})

					if (deleteResult.deletedCount > 0) {
						console.log(
							`Successfully deleted ${deleteResult.deletedCount} tracks for ETag: "${etag}"`,
						)
						deletedCount += deleteResult.deletedCount
					} else {
						console.warn(
							`Deletion command executed for ETag "${etag}", but no tracks were deleted. IDs: ${idsToDelete.join(", ")}`,
						)
					}
				} catch (dbError) {
					console.error(
						`Database error deleting tracks for ETag "${etag}": ${dbError.message}`,
					)
				}
			}
		}
	}

	console.log(`Finished processing. Total tracks deleted: ${deletedCount}.`)
}

main()
