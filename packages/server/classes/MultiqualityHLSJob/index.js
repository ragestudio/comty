import fs from "node:fs"
import path from "node:path"
import { exec } from "node:child_process"
import { EventEmitter } from "node:events"

export default class MultiqualityHLSJob {
    constructor({
        input,
        outputDir,
        outputMasterName = "master.m3u8",
        levels,
    }) {
        this.input = input
        this.outputDir = outputDir
        this.levels = levels
        this.outputMasterName = outputMasterName

        this.bin = require("ffmpeg-static")

        return this
    }

    events = new EventEmitter()

    buildCommand = () => {
        const cmdStr = [
            this.bin,
            `-v quiet -stats`,
            `-i ${this.input}`,
            `-filter_complex`,
        ]

        // set split args
        let splitLevels = [
            `[0:v]split=${this.levels.length}`
        ]

        this.levels.forEach((level, i) => {
            splitLevels[0] += (`[v${i + 1}]`)
        })

        for (const [index, level] of this.levels.entries()) {
            if (level.original) {
                splitLevels.push(`[v1]copy[v1out]`)
                continue
            }

            let scaleFilter = `[v${index + 1}]scale=w=${level.width}:h=trunc(ow/a/2)*2[v${index + 1}out]`

            splitLevels.push(scaleFilter)
        }

        cmdStr.push(`"${splitLevels.join(";")}"`)

        // set levels map
        for (const [index, level] of this.levels.entries()) {
            let mapArgs = [
                `-map "[v${index + 1}out]"`,
                `-x264-params "nal-hrd=cbr:force-cfr=1"`,
                `-c:v:${index} ${level.codec}`,
                `-b:v:${index} ${level.bitrate}`,
                `-maxrate:v:${index} ${level.bitrate}`,
                `-minrate:v:${index} ${level.bitrate}`,
                `-bufsize:v:${index} ${level.bitrate}`,
                `-preset ${level.preset}`,
                `-g 48`,
                `-sc_threshold 0`,
                `-keyint_min 48`,
            ]

            cmdStr.push(...mapArgs)
        }

        // set output
        cmdStr.push(`-f hls`)
        cmdStr.push(`-hls_time 2`)
        cmdStr.push(`-hls_playlist_type vod`)
        cmdStr.push(`-hls_flags independent_segments`)
        cmdStr.push(`-hls_segment_type mpegts`)
        cmdStr.push(`-hls_segment_filename stream_%v/data%02d.ts`)
        cmdStr.push(`-master_pl_name ${this.outputMasterName}`)

        cmdStr.push(`-var_stream_map`)

        let streamMapVar = []

        for (const [index, level] of this.levels.entries()) {
            streamMapVar.push(`v:${index}`)
        }

        cmdStr.push(`"${streamMapVar.join(" ")}"`)
        cmdStr.push(`"stream_%v/stream.m3u8"`)

        return cmdStr.join(" ")
    }

    run = () => {
        const cmdStr = this.buildCommand()

        console.log(cmdStr)

        const cwd = `${path.dirname(this.input)}/hls`

        if (!fs.existsSync(cwd)) {
            fs.mkdirSync(cwd, { recursive: true })
        }

        console.log(`[HLS] Started multiquality transcode`, {
            input: this.input,
            cwd: cwd,
        })

        const process = exec(
            cmdStr,
            {
                cwd: cwd,
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`[HLS] Failed to transcode >`, error)

                    return this.events.emit("error", error)
                }

                if (stderr) {
                    //return this.events.emit("error", stderr)
                }

                console.log(`[HLS] Finished transcode >`, cwd)

                return this.events.emit("end", {
                    filepath: path.join(cwd, this.outputMasterName),
                    isDirectory: true,
                })
            }
        )

        process.stdout.on("data", (data) => {
            console.log(data.toString())
        })
    }

    on = (key, cb) => {
        this.events.on(key, cb)
        return this
    }
}