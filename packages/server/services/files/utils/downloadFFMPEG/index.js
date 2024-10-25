import fs from "node:fs"
import os from "node:os"
import axios from "axios"

export default async (outputDir) => {
    const arch = os.arch()

    console.log(`Downloading ffmpeg for ${arch}...`)
    const baseURL = `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${arch}-static.tar.xz`


    const response = await axios.get(baseURL, {
        responseType: "stream"
    })

    const ffmpegPath = path.join(outputDir, `ffmpeg-${arch}.tar.xz`)
    const ffmpegFile = fs.createWriteStream(ffmpegPath)

    response.data.pipe(ffmpegFile)
}