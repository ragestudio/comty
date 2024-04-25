import Core from "evite/src/core"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"
import isURL from "@utils/isURL"

export default class ffmpeg extends Core {
    static coreBaseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"

    ffmpegInstance = new FFmpeg()

    state = {
        coreLoaded: false
    }

    backgroundInitialize = [
        this.loadCore
    ]

    public = {
        instance: this.ffmpegInstance,
        transcode: this.transcode,
    }

    loadCore = async () => {
        this.state.coreLoaded = false

        this.console.log("Loading ffmpeg core...")

        this.ffmpegInstance.on("log", (data) => {
            console.log(data)
        })

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await this.ffmpegInstance.load({
            coreURL: await toBlobURL(`${ffmpeg.coreBaseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${ffmpeg.coreBaseURL}/ffmpeg-core.wasm`, "application/wasm"),
            workerURL: await toBlobURL(`${ffmpeg.coreBaseURL}/ffmpeg-core.worker.js`, "text/javascript"),
        })

        this.console.log("Ffmpeg core loaded")

        this.state.coreLoaded = true

        return true
    }

    async transcode(file, options) {
        if (!this.state.coreLoaded) {
            this.console.warn("Core is not loaded, trying to load it...")
            await this.loadCore()
        }

        if (isURL(file)) {
            file = await fetchFile(file)
        }

        
    }

    async onInitialize() {

    }
}