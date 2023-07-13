function MohayonaoWavDecoder(opts) {
    this.readerMeta = false
    this.opts = opts || {}
}

MohayonaoWavDecoder.prototype.decodeChunk = function (arrayBuffer) {
    return new Promise(resolve => {
        resolve(this.decodeChunkSync(arrayBuffer))
    })
}

MohayonaoWavDecoder.prototype.decodeChunkSync = function (arrayBuffer) {
    let reader = new MohayonaoReader(new DataView(arrayBuffer))

    // first call should parse RIFF meta data and store for subsequent reads
    if (!this.readerMeta) {
        this._init(reader)
    }

    let audioData = this._decodeData(reader)

    if (audioData instanceof Error) {
        throw audioData
    }

    return audioData
}

MohayonaoWavDecoder.prototype._init = function (reader) {
    if (reader.string(4) !== "RIFF") {
        throw new TypeError("Invalid WAV file")
    }

    reader.uint32() // skip file length

    if (reader.string(4) !== "WAVE") {
        throw new TypeError("Invalid WAV file")
    }

    let dataFound = false, chunkType, chunkSize

    do {
        chunkType = reader.string(4)
        chunkSize = reader.uint32()

        switch (chunkType) {
            case "fmt ":
                this.readerMeta = this._decodeMetaInfo(reader, chunkSize)

                if (this.readerMeta instanceof Error) {
                    throw this.readerMeta;
                }

                break;
            case "data":
                dataFound = true
                break;
            default:
                reader.skip(chunkSize)
                break;
        }
    } while (!dataFound)
}

MohayonaoWavDecoder.prototype._decodeMetaInfo = function (reader, chunkSize) {
    const formats = {
        0x0001: "lpcm",
        0x0003: "lpcm"
    }

    const formatId = reader.uint16()

    if (!formats.hasOwnProperty(formatId)) {
        return new TypeError("Unsupported format in WAV file: 0x" + formatId.toString(16))
    }

    const meta = {
        formatId,
        floatingPoint: formatId === 0x0003,
        numberOfChannels: reader.uint16(),
        sampleRate: reader.uint32(),
        byteRate: reader.uint32(),
        blockSize: reader.uint16(),
        bitDepth: reader.uint16()
    }

    reader.skip(chunkSize - 16)

    const decoderOption = meta.floatingPoint ? "f" : this.opts.symmetric ? "s" : ""
    meta.readerMethodName = "pcm" + meta.bitDepth + decoderOption

    if (!reader[meta.readerMethodName]) {
        return new TypeError("Not supported bit depth: " + meta.bitDepth)
    }

    return meta
}

MohayonaoWavDecoder.prototype._decodeData = function (reader) {
    let chunkSize = reader.remain()
    let length = Math.floor(chunkSize / this.readerMeta.blockSize)
    let channelData = new Array(this.readerMeta.numberOfChannels)

    for (let ch = 0; ch < this.readerMeta.numberOfChannels; ch++) {
        channelData[ch] = new Float32Array(length)
    }

    if (!reader[this.readerMeta.readerMethodName]) {
        throw new Error(`Reader for [${this.readerMeta.readerMethodName}] not found or not supported bit depth.`)
    }

    const read = reader[this.readerMeta.readerMethodName].bind(reader)

    const numChannels = this.readerMeta.numberOfChannels;

    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            channelData[ch][i] = read();
        }
    }

    return {
        channelData,
        length,
        numberOfChannels: this.readerMeta.numberOfChannels,
        sampleRate: this.readerMeta.sampleRate,
    };
}


function MohayonaoReader(dataView) {
    this.view = dataView;
    this.pos = 0;
}

MohayonaoReader.prototype.remain = function () {
    return this.view.byteLength - this.pos;
}

MohayonaoReader.prototype.skip = function (n) {
    this.pos += n;
}

MohayonaoReader.prototype.uint8 = function () {
    const data = this.view.getUint8(this.pos, true);
    this.pos += 1;
    return data;
}

MohayonaoReader.prototype.int16 = function () {
    const data = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return data;
}

MohayonaoReader.prototype.uint16 = function () {
    const data = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return data;
}

MohayonaoReader.prototype.uint32 = function () {
    const data = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return data;
}

MohayonaoReader.prototype.string = function (n) {
    let data = "";
    for (let i = 0; i < n; i++) {
        data += String.fromCharCode(this.uint8());
    }
    return data;
}

MohayonaoReader.prototype.pcm8 = function () {
    const data = this.view.getUint8(this.pos) - 128;
    this.pos += 1;
    return data < 0 ? data / 128 : data / 127;
}

MohayonaoReader.prototype.pcm8s = function () {
    const data = this.view.getUint8(this.pos) - 127.5;
    this.pos += 1;
    return data / 127.5;
}

MohayonaoReader.prototype.pcm16 = function () {
    const data = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return data < 0 ? data / 32768 : data / 32767;
}

MohayonaoReader.prototype.pcm16s = function () {
    const data = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return data / 32768;
}

MohayonaoReader.prototype.pcm24 = function () {
    let x0 = this.view.getUint8(this.pos + 0);
    let x1 = this.view.getUint8(this.pos + 1);
    let x2 = this.view.getUint8(this.pos + 2);
    let xx = (x0 + (x1 << 8) + (x2 << 16));
    let data = xx > 0x800000 ? xx - 0x1000000 : xx;
    this.pos += 3;
    return data < 0 ? data / 8388608 : data / 8388607;
}

MohayonaoReader.prototype.pcm24s = function () {
    let x0 = this.view.getUint8(this.pos + 0);
    let x1 = this.view.getUint8(this.pos + 1);
    let x2 = this.view.getUint8(this.pos + 2);
    let xx = (x0 + (x1 << 8) + (x2 << 16));
    let data = xx > 0x800000 ? xx - 0x1000000 : xx;
    this.pos += 3;
    return data / 8388608;
}

MohayonaoReader.prototype.pcm32 = function () {
    const data = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return data < 0 ? data / 2147483648 : data / 2147483647;
}

MohayonaoReader.prototype.pcm32s = function () {
    const data = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return data / 2147483648;
}

MohayonaoReader.prototype.pcm32f = function () {
    const data = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return data;
}

MohayonaoReader.prototype.pcm64f = function () {
    const data = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return data;
}

const decoder = new MohayonaoWavDecoder()

function int16ToFloat32(uint16, channels) {
    // https://stackoverflow.com/a/35248852
    for (let i = 0, j = 0, n = 1; i < uint16.length; i++) {
        const int = uint16[i];
        // If the high bit is on, then it is a negative number, and actually counts backwards.
        const float = int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
        // interleave
        channels[(n = ++n % 2)][!n ? j++ : j - 1] = float;
    }
}

class AudioDataWorkletStream extends AudioWorkletProcessor {
    constructor(options) {
        super(options)

        Object.assign(this, options.processorOptions, {
            uint8: new Uint8Array(290689440 - 44),
        })

        globalThis.console.log(currentTime, currentFrame, this.index, this.offset)

        this.port.onmessage = this.appendBuffers.bind(this);
    }

    async appendBuffers({ data: value }) {
        for (let i = !this.index ? 44 : 0; i < value.length; i++) {
            this.uint8[this.index++] = value[i];
            // accumulate 344 * 512 * 1.5 of data
            // to avoid glitches at beginning of playback
            // maintain this.index > this.offset
            // to avoid gaps during playback
            if (this.index === 344 * 512 * 1.5) {
                this.port.postMessage({ start: true });
            }
        }
    }

    endOfStream() {
        this.port.postMessage({
            ended: true,
            currentTime,
            currentFrame,
        })
    }
    
    process(inputs, outputs) {
        if (this.offset === this.uint8.length) {
            this.endOfStream();
            return false;
        }

        const channels = outputs.flat();

        const uint8 = new Uint8Array(512);

        for (let i = 0; i < 512; i++, this.offset++) {
            if (this.offset === this.uint8.length) {
                console.log(this.uint8);
                break;
            }

            uint8[i] = this.uint8[this.offset];
        }

        const uint16 = new Uint16Array(uint8.buffer);

        int16ToFloat32(uint16, channels);
        
        return true;
    }
}

registerProcessor('audio-data-worklet-stream', AudioDataWorkletStream);