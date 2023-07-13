import BufferedStreamReader from "./BufferedStreamReader.js"

export default class AudioStreamPlayer {
    // these shouldn't change once set
    _worker = null
    _readBufferSize = 1024 * 100

    // these are reset
    _sessionId = null             // used to prevent race conditions between cancel/starts
    _reader = null

    buffers = []

    constructor(audioContext, readBufferSize) {
        this.audioContext = audioContext

        this._worker = new Worker("/workers/wav-decoder.js")

        this._worker.onerror = (event) => {
            this.reset()
        }

        this._worker.onmessage = this._onWorkerMessage.bind(this)

        if (readBufferSize) {
            this._readBufferSize = readBufferSize
        }

        this.instanceSource = this.audioContext.createBufferSource()

        this.reset()
    }

    reset() {
        this.audioContext.suspend()

        if (this._reader) {
            this._reader.abort()
            this._reader._reset()
        }

        if (this._sessionId) {
            performance.clearMarks(this._downloadMarkKey);
        }

        this._sessionId = null;
        this._reader = null;

        this.buffer = null
    }

    start(url) {
        this.reset()

        this._sessionId = performance.now()

        performance.mark(this._downloadMarkKey)

        const reader = new BufferedStreamReader(new Request(url), this._readBufferSize)

        reader.onRead = this._downloadProgress.bind(this)
        reader.onBufferFull = this.decode.bind(this)

        reader.read().catch((e) => {
            console.error(e)
        })

        this._reader = reader

        this.resume()

        this.instanceSource.connect(this.audioContext.destination)

        this.instanceSource.start(0)
    }

    pause() {
        this.audioContext.suspend()
    }
    resume() {
        this.audioContext.resume()
    }

    seek(time) {

    }

    decode({ bytes, done }) {
        const sessionId = this._sessionId

        this._worker.postMessage({ decode: bytes.buffer, sessionId }, [bytes.buffer])
    }

    // prevent race condition by checking sessionId
    _onWorkerMessage(event) {
        const { decoded, sessionId } = event.data;

        if (decoded.channelData) {
            if (!(this._sessionId && this._sessionId === sessionId)) {
                console.log("race condition detected for closed session");
                return;
            }

            this.pushToBuffer(decoded);
        }
    }

    _downloadProgress({ bytes, totalRead, totalBytes, done }) {

        //console.log(done, (totalRead/totalBytes*100).toFixed(2) );
    }

    get _downloadMarkKey() {
        return `download-start-${this._sessionId}`;
    }
    _getDownloadStartTime() {
        return performance.getEntriesByName(this._downloadMarkKey)[0].startTime;
    }

    // outputBuffer() {
    //     const { src, buffer, numberOfChannels, channelData } = this.audioBufferNodes[this._bufferPosition]

    //     src.onended = () => {
    //         this._bufferPosition++

    //         this.outputBuffer()
    //     }

    //     for (let c = 0; c < numberOfChannels; c++) {
    //         buffer.copyToChannel(channelData[c], c);
    //     }

    //     src.buffer = buffer
    //     src.connect(this.audioContext.destination)

    //     src.start(0)
    // }

    pushToBuffer({ channelData, length, numberOfChannels, sampleRate }) {
        const buffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate)

        for (let c = 0; c < numberOfChannels; c++) {
            buffer.copyToChannel(channelData[c], c);
        }
    }
}