import fs from "node:fs"
import path from "node:path"
import { exec } from "node:child_process"
import { EventEmitter } from "node:events"

export default class SegmentedAudioMPDJob {
    constructor({
        input,
        outputDir,
        outputMasterName = "master.mpd",

        audioCodec = "aac",
        audioBitrate = undefined,
        audioSampleRate = undefined,
        segmentTime = 10,
    }) {
        this.input = input
        this.outputDir = outputDir
        this.outputMasterName = outputMasterName

        this.audioCodec = audioCodec
        this.audioBitrate = audioBitrate
        this.segmentTime = segmentTime
        this.audioSampleRate = audioSampleRate

        this.bin = require("ffmpeg-static")

        return this
    }

    events = new EventEmitter()

    buildCommand = () => {
        const cmdStr = [
            this.bin,
            `-v quiet -stats`,
            `-i ${this.input}`,
            `-c:a ${this.audioCodec}`,
            `-map 0:a`,
            `-map_metadata -1`,
            `-f dash`,
            `-dash_segment_type mp4`,
            `-segment_time ${this.segmentTime}`,
            `-use_template 1`,
            `-use_timeline 1`,
            `-init_seg_name "init.m4s"`,
        ]

        if (typeof this.audioBitrate !== "undefined") {
            cmdStr.push(`-b:a ${this.audioBitrate}`)
        }

        if (typeof this.audioSampleRate !== "undefined") {
            cmdStr.push(`-ar ${this.audioSampleRate}`)
        }

        cmdStr.push(this.outputMasterName)

        return cmdStr.join(" ")
    }

    run = () => {
        const cmdStr = this.buildCommand()

        console.log(cmdStr)

        const cwd = `${path.dirname(this.input)}/dash`

        if (!fs.existsSync(cwd)) {
            fs.mkdirSync(cwd, { recursive: true })
        }

        console.log(`[DASH] Started audio segmentation`, {
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
                    console.log(`[DASH] Failed to segment audio >`, error)

                    return this.events.emit("error", error)
                }

                if (stderr) {
                    //return this.events.emit("error", stderr)
                }

                console.log(`[DASH] Finished segmenting audio >`, cwd)

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