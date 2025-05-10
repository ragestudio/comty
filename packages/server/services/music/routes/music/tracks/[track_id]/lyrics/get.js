import { TrackLyric } from "@db_models"
import axios from "axios"

function parseTimeToMs(timeStr) {
	const [minutes, seconds, milliseconds] = timeStr.split(":")

	return (
		Number(minutes) * 60 * 1000 +
		Number(seconds) * 1000 +
		Number(milliseconds)
	)
}

async function remoteLcrToSyncedLyrics(lrcUrl) {
	const { data } = await axios.get(lrcUrl)

	let syncedLyrics = data

	syncedLyrics = syncedLyrics.split("\n")

	syncedLyrics = syncedLyrics.map((line) => {
		const syncedLine = {}

		//syncedLine.time = line.match(/\[.*\]/)[0]
		syncedLine.time = line.split(" ")[0]
		syncedLine.text = line.replace(syncedLine.time, "").trim()

		if (syncedLine.text === "") {
			delete syncedLine.text
			syncedLine.break = true
		}

		syncedLine.time = syncedLine.time.replace(/\[|\]/g, "")
		syncedLine.time = syncedLine.time.replace(".", ":")

		return syncedLine
	})

	syncedLyrics = syncedLyrics.map((syncedLine, index) => {
		const nextLine = syncedLyrics[index + 1]

		syncedLine.startTimeMs = parseTimeToMs(syncedLine.time)
		syncedLine.endTimeMs = nextLine
			? parseTimeToMs(nextLine.time)
			: parseTimeToMs(syncedLyrics[syncedLyrics.length - 1].time)

		return syncedLine
	})

	return syncedLyrics
}

export default async (req) => {
	const { track_id } = req.params
	let { translate_lang = "original" } = req.query

	let result = await TrackLyric.findOne({
		track_id,
	})

	if (!result) {
		throw new OperationError(404, "Track lyric not found")
	}

	result = result.toObject()

	result.translated_lang = translate_lang
	result.available_langs = []

	const lrc = result.lrc_v2 ?? result.lrc

	result.isLyricsV2 = !!result.lrc_v2

	if (typeof lrc === "object") {
		result.available_langs = Object.keys(lrc)

		if (!lrc[translate_lang]) {
			translate_lang = "original"
		}

		if (lrc[translate_lang]) {
			if (result.isLyricsV2 === true) {
				result.synced_lyrics = await axios.get(lrc[translate_lang])

				result.synced_lyrics = result.synced_lyrics.data
			} else {
				result.synced_lyrics = await remoteLcrToSyncedLyrics(
					result.lrc[translate_lang],
				)
			}
		}
	}

	if (result.sync_audio_at) {
		result.sync_audio_at_ms = parseTimeToMs(result.sync_audio_at)
	}

	result.lrc
	delete result.lrc_v2
	delete result.__v

	return result
}
