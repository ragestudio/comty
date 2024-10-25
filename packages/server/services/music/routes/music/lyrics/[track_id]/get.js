import { TrackLyric } from "@db_models"
import axios from "axios"

function parseTimeToMs(timeStr) {
    const [minutes, seconds, milliseconds] = timeStr.split(":")

    return Number(minutes) * 60 * 1000 + Number(seconds) * 1000 + Number(milliseconds)
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
        syncedLine.endTimeMs = nextLine ? parseTimeToMs(nextLine.time) : parseTimeToMs(syncedLyrics[syncedLyrics.length - 1].time)

        return syncedLine
    })

    return syncedLyrics
}

export default async (req) => {
    const { track_id } = req.params
    let { translate_lang = "original" } = req.query

    let trackLyrics = await TrackLyric.findOne({
        track_id
    })

    if (!trackLyrics) {
        throw new OperationError(404, "Track lyric not found")
    }

    trackLyrics = trackLyrics.toObject()

    if (typeof trackLyrics.lrc === "object") {
        trackLyrics.translated_lang = translate_lang

        if (trackLyrics.lrc[translate_lang]) {
            trackLyrics.synced_lyrics = await remoteLcrToSyncedLyrics(trackLyrics.lrc[translate_lang])
        }

        trackLyrics.available_langs = Object.keys(trackLyrics.lrc)
    }

    if (trackLyrics.sync_audio_at) {
        trackLyrics.sync_audio_at_ms = parseTimeToMs(trackLyrics.sync_audio_at)
    }

    return trackLyrics
}