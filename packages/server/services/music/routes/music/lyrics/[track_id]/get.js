import { TrackLyric } from "@db_models"
import axios from "axios"

function parseTimeToMs(timeStr) {
    const [minutes, seconds, milliseconds] = timeStr.split(":")

    return Number(minutes) * 60 * 1000 + Number(seconds) * 1000 + Number(milliseconds)
}

export default async (req) => {
    const { track_id } = req.params
    let { translate_lang = "original" } = req.query

    let trackLyric = await TrackLyric.findOne({
        track_id
    })

    if (!trackLyric) {
        throw new OperationError(404, "Track lyric not found")
    }

    trackLyric = trackLyric.toObject()

    if (typeof trackLyric.lrc === "object") {
        trackLyric.available_langs = Object.entries(trackLyric.lrc).map(([key, value]) => {
            return {
                id: key,
                name: key,
                value: value
            }
        })

        if (typeof trackLyric.lrc[translate_lang] === "undefined") {
            translate_lang = "original"
        }

        trackLyric.lang = translate_lang

        trackLyric.lrc = trackLyric.lrc[translate_lang]
        
        const { data } = await axios.get(trackLyric.lrc).catch((err) => {
            return false
        })

        trackLyric.lrc = data
    }else {
        trackLyric.available_langs = [{
            id: "original",
            name: "Original",
            value: null
        }]
    }

    if (trackLyric.lrc) {
        trackLyric.lrc = trackLyric.lrc.split("\n")
        trackLyric.lrc = trackLyric.lrc.map((line) => {
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

        trackLyric.lrc = trackLyric.lrc.map((syncedLine, index) => {
            const nextLine = trackLyric.lrc[index + 1]

            syncedLine.startTimeMs = parseTimeToMs(syncedLine.time)
            syncedLine.endTimeMs = nextLine ? parseTimeToMs(nextLine.time) : parseTimeToMs(trackLyric.lrc[trackLyric.lrc.length - 1].time)

            return syncedLine
        })
    }

    if (trackLyric.sync_audio_at) {
        trackLyric.sync_audio_at_ms = parseTimeToMs(trackLyric.sync_audio_at)
    }

    return trackLyric
}