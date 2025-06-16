import { TrackLyric } from "@db_models"
import axios from "axios"

function secondsToMs(number) {
	return number * 1000
}

class LRCV1 {
	static timeStrToMs(timeStr) {
		const [minutes, seconds, milliseconds] = timeStr.split(":")

		return (
			Number(minutes) * 60 * 1000 +
			Number(seconds) * 1000 +
			Number(milliseconds)
		)
	}

	static timeStrToSeconds(timeStr) {
		const [minutes, seconds, milliseconds] = timeStr.split(":")

		return (
			Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000
		)
	}

	static parseString(str) {
		str = str.split("\n")

		str = str.map((str) => {
			let line = {}

			line.time = str.split(" ")[0]
			line.text = str.replace(line.time, "").trim()

			// detect empty lines as breaks
			if (line.text === "" || line.text === "<break>") {
				delete line.text
				line.break = true
			}

			// parse time
			line.time = line.time.replace(/\[|\]/g, "")
			line.time = line.time.replace(".", ":")
			line.time = this.timeStrToSeconds(line.time)

			return line
		})

		return str
	}

	static setTimmings(lyricsArray) {
		lyricsArray = lyricsArray.map((line, index) => {
			const nextLine = lyricsArray[index + 1]

			line.start_ms = secondsToMs(line.time)
			line.end_ms = secondsToMs(nextLine ? nextLine.time : line.time + 1)

			return line
		})

		return lyricsArray
	}
}

export default async (req) => {
	const { track_id } = req.params
	let { translate_lang = "original" } = req.query

	let result = await TrackLyric.findOne({
		track_id,
	}).lean()

	if (!result) {
		throw new OperationError(404, "Track lyric not found")
	}

	result.translated_lang = translate_lang
	result.available_langs = []

	if (typeof result.lrc === "object") {
		result.available_langs = Object.keys(result.lrc)

		if (!result.lrc[translate_lang]) {
			translate_lang = "original"
		}

		if (result.lrc[translate_lang]) {
			if (typeof result.lrc[translate_lang] === "string") {
				let { data } = await axios.get(result.lrc[translate_lang])

				result.synced_lyrics = LRCV1.parseString(data)
				result.synced_lyrics = LRCV1.setTimmings(result.synced_lyrics)
			} else {
				result.synced_lyrics = result.lrc[translate_lang]
				result.synced_lyrics = LRCV1.setTimmings(result.synced_lyrics)
			}
		}
	}

	if (result.video_starts_at || result.sync_audio_at) {
		result.video_starts_at_ms = LRCV1.timeStrToMs(
			result.video_starts_at ?? result.sync_audio_at,
		)
	}

	delete result.__v

	return result
}
