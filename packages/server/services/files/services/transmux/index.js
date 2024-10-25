import fs from "node:fs"
import path from "node:path"

import MultiqualityHLSJob from "@shared-classes/MultiqualityHLSJob"

const transmuxers = [
    {
        id: "mq-hls",
        container: "hls",
        extension: "m3u8",
        multipleOutput: true,
        buildCommand: (input, outputDir) => {
            return new MultiqualityHLSJob({
                input: input,
                outputDir: outputDir,
                outputMasterName: "master.m3u8",
                levels: [
                    {
                        original: true,
                        codec: "libx264",
                        bitrate: "10M",
                        preset: "ultrafast",
                    },
                    {
                        codec: "libx264",
                        width: 1280,
                        bitrate: "3M",
                        preset: "ultrafast",
                    }
                ]
            })
        },
    }
]

export default async (params) => {
    if (!params) {
        throw new Error("params is required")
    }

    if (!params.filepath) {
        throw new Error("filepath is required")
    }

    if (!params.cachePath) {
        throw new Error("cachePath is required")
    }

    if (!params.transmuxer) {
        throw new Error("transmuxer is required")
    }

    if (!fs.existsSync(params.filepath)) {
        throw new Error(`File ${params.filepath} not found`)
    }

    const transmuxer = transmuxers.find((item) => item.id === params.transmuxer)

    if (!transmuxer) {
        throw new Error(`Transmuxer ${params.transmuxer} not found`)
    }

    const jobPath = path.dirname(params.filepath)

    if (!fs.existsSync(path.dirname(jobPath))) {
        fs.mkdirSync(path.dirname(jobPath), { recursive: true })
    }

    return await new Promise((resolve, reject) => {
        try {
            const command = transmuxer.buildCommand(params.filepath, jobPath)

            command
                .on("progress", function (progress) {
                    console.log("Processing: " + progress.percent + "% done")
                })
                .on("error", (err) => {
                    reject(err)
                })
                .on("end", (data) => {
                    resolve(data)
                })
                .run()
        } catch (error) {
            console.error(`[TRANSMUX] Transmuxing failed`, error)
            reject(error)
        }
    })
}