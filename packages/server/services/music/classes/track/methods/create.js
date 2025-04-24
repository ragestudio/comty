import { Track } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"
import * as FFMPEGLib from "@shared-classes/FFMPEGLib"

import ModifyTrack from "./modify"

export default async (payload = {}) => {
	if (typeof payload.title !== "string") {
		payload.title = undefined
	}

	if (typeof payload.album !== "string") {
		payload.album = undefined
	}

	if (typeof payload.artist !== "string") {
		payload.artist = undefined
	}

	if (typeof payload.cover !== "string") {
		payload.cover = undefined
	}

	if (typeof payload.source !== "string") {
		payload.source = undefined
	}

	if (typeof payload.user_id !== "string") {
		payload.user_id = undefined
	}

	requiredFields(["title", "source", "user_id"], payload)

	if (typeof payload._id === "string") {
		return await ModifyTrack(payload._id, payload)
	}

	const probe = await FFMPEGLib.Utils.probe(payload.source)

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

	const obj = {
		title: payload.title ?? metadata.tags["Title"],
		album: payload.album ?? metadata.tags["Album"],
		artist: payload.artist ?? metadata.tags["Artist"],
		cover:
			payload.cover ??
			"https://storage.ragestudio.net/comty-static-assets/default_song.png",
		source: payload.source,
		metadata: metadata,
	}

	if (Array.isArray(payload.artists)) {
		obj.artist = payload.artists.join(", ")
	}

	let track = new Track({
		...obj,
		publisher: {
			user_id: payload.user_id,
		},
	})

	await track.save()

	return track.toObject()
}
