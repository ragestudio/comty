import DbManager from "@shared-classes/DbManager"
import { MusicRelease, Track } from "@db_models"
import * as FFMPEGLib from "@shared-classes/FFMPEGLib"

// try to parse some queries from argv
let releaseId = process.argv.find((arg) => arg.startsWith("--release="))

async function main() {
	if (!releaseId) {
		console.error("No release ID provided. Exiting.")
		process.exit(1)
	}

	releaseId = releaseId.replace("--release=", "")

	await global.injectEnvFromInfisical()

	const db = new DbManager()
	await db.initialize()

	const release = await MusicRelease.findOne({
		_id: releaseId,
	}).lean()

	if (!release) {
		console.error(`Release not found: ${releaseId}`)
		process.exit(1)
	}

	console.log(release)

	const tracks = await Track.find({
		_id: release.items,
	})

	console.log(`Total tracks in database: ${tracks.length}`)

	for await (const track of tracks) {
		if (!track.source) {
			console.log(`Skipping track ${track._id} because it has no source`)
			continue
		}

		console.log(`Processing track ${track._id}`, track)

		const probe = await FFMPEGLib.Utils.probe(track.source)

		let metadata = {
			format: probe.streams[0].codec_name,
			channels: probe.streams[0].channels,
			bitrate: probe.streams[0].bit_rate ?? probe.format.bit_rate,
			sampleRate: probe.streams[0].sample_rate,
			bits:
				probe.streams[0].bits_per_sample ??
				probe.streams[0].bits_per_raw_sample,
			duration: probe.format.duration,
			tags: probe.format.tags ?? {},
		}

		if (metadata.format) {
			metadata.format = metadata.format.toUpperCase()
		}

		if (
			metadata.format === "FLAC" ||
			metadata.format === "WAV" ||
			metadata.format === "ALAC"
		) {
			metadata.lossless = true
		}

		await Track.updateOne(
			{ _id: track._id },
			{
				metadata: metadata,
			},
		)

		console.log(`Updated metadata for track ${track._id}`)
	}

	console.log(`Finished processing.`)
	process.exit(0)
}

main()
