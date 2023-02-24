"use strict";
(() => {
    var __async = (__this, __arguments, generator) => {
        return new Promise((resolve, reject) => {
            var fulfilled = (value) => {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            };
            var rejected = (value) => {
                try {
                    step(generator.throw(value));
                } catch (e) {
                    reject(e);
                }
            };
            var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
            step((generator = generator.apply(__this, __arguments)).next());
        });
    };

    // src/consts.ts
    var realtimeBpmProcessorName = "realtime-bpm-processor";
    var startThreshold = 0.95;
    var minValidThreshold = 0.3;
    var minPeaks = 15;
    var thresholdStep = 0.05;
    var skipForwardIndexes = 1e4;

    // src/utils.ts
    function descendingOverThresholds(_0) {
        return __async(this, arguments, function* (onThreshold, minValidThreshold2 = minValidThreshold, startThreshold2 = startThreshold, thresholdStep2 = thresholdStep) {
            let threshold = startThreshold2;
            do {
                threshold -= thresholdStep2;
                const shouldExit = yield onThreshold(threshold);
                if (shouldExit) {
                    break;
                }
            } while (threshold > minValidThreshold2);
        });
    }
    function generateValidPeaksModel(minValidThreshold2 = minValidThreshold, startThreshold2 = startThreshold, thresholdStep2 = thresholdStep) {
        const object = {};
        let threshold = startThreshold2;
        do {
            threshold -= thresholdStep2;
            object[threshold.toString()] = [];
        } while (threshold > minValidThreshold2);
        return object;
    }
    function generateNextIndexPeaksModel(minValidThreshold2 = minValidThreshold, startThreshold2 = startThreshold, thresholdStep2 = thresholdStep) {
        const object = {};
        let threshold = startThreshold2;
        do {
            threshold -= thresholdStep2;
            object[threshold.toString()] = 0;
        } while (threshold > minValidThreshold2);
        return object;
    }
    function chunckAggregator() {
        const bufferSize = 4096;
        let _bytesWritten = 0;
        let buffer = new Float32Array(0);
        function initBuffer() {
            _bytesWritten = 0;
            buffer = new Float32Array(0);
        }
        function isBufferFull() {
            return _bytesWritten === bufferSize;
        }
        function flush() {
            initBuffer();
        }
        return function (pcmData) {
            if (isBufferFull()) {
                flush();
            }
            const newBuffer = new Float32Array(buffer.length + pcmData.length);
            newBuffer.set(buffer, 0);
            newBuffer.set(pcmData, buffer.length);
            buffer = newBuffer;
            _bytesWritten += pcmData.length;
            return {
                isBufferFull: isBufferFull(),
                buffer,
                bufferSize
            };
        };
    }

    // src/analyzer.ts
    function findPeaksAtThreshold(data, threshold, offset = 0, skipForwardIndexes2 = skipForwardIndexes) {
        const peaks = [];
        const { length } = data;
        for (let i = offset; i < length; i += 1) {
            if (data[i] > threshold) {
                peaks.push(i);
                i += skipForwardIndexes2;
            }
        }
        return {
            peaks,
            threshold
        };
    }
    function computeBpm(_0, _1) {
        return __async(this, arguments, function* (data, audioSampleRate, minPeaks2 = minPeaks) {
            let hasPeaks = false;
            let foundThreshold = minValidThreshold;
            yield descendingOverThresholds((threshold) => __async(this, null, function* () {
                if (hasPeaks) {
                    return true;
                }
                if (data[threshold].length > minPeaks2) {
                    hasPeaks = true;
                    foundThreshold = threshold;
                }
                return false;
            }));
            if (hasPeaks && foundThreshold) {
                const intervals = identifyIntervals(data[foundThreshold]);
                const tempos = groupByTempo(audioSampleRate, intervals);
                const candidates = getTopCandidates(tempos);
                const bpmCandidates = {
                    bpm: candidates,
                    threshold: foundThreshold
                };
                return bpmCandidates;
            }
            return {
                bpm: [],
                threshold: foundThreshold
            };
        });
    }
    function getTopCandidates(candidates, length = 5) {
        return candidates.sort((a, b) => b.count - a.count).splice(0, length);
    }
    function identifyIntervals(peaks) {
        const intervals = [];
        for (let n = 0; n < peaks.length; n++) {
            for (let i = 0; i < 10; i++) {
                const peak = peaks[n];
                const peakIndex = n + i;
                const interval = peaks[peakIndex] - peak;
                const foundInterval = intervals.some((intervalCount) => {
                    if (intervalCount.interval === interval) {
                        intervalCount.count += 1;
                        return intervalCount.count;
                    }
                    return false;
                });
                if (!foundInterval) {
                    const item = {
                        interval,
                        count: 1
                    };
                    intervals.push(item);
                }
            }
        }
        return intervals;
    }
    function groupByTempo(audioSampleRate, intervalCounts) {
        const tempoCounts = [];
        for (const intervalCount of intervalCounts) {
            if (intervalCount.interval === 0) {
                continue;
            }
            intervalCount.interval = Math.abs(intervalCount.interval);
            let theoreticalTempo = 60 / (intervalCount.interval / audioSampleRate);
            while (theoreticalTempo < 90) {
                theoreticalTempo *= 2;
            }
            while (theoreticalTempo > 180) {
                theoreticalTempo /= 2;
            }
            theoreticalTempo = Math.round(theoreticalTempo);
            const foundTempo = tempoCounts.some((tempoCount) => {
                if (tempoCount.tempo === theoreticalTempo) {
                    tempoCount.count += intervalCount.count;
                    return tempoCount.count;
                }
                return false;
            });
            if (!foundTempo) {
                const tempo = {
                    tempo: theoreticalTempo,
                    count: intervalCount.count,
                    confidence: 0
                };
                tempoCounts.push(tempo);
            }
        }
        return tempoCounts;
    }

    // src/realtime-bpm-analyzer.ts
    var initialValue = {
        minValidThreshold: () => minValidThreshold,
        timeoutStabilization: () => 0,
        validPeaks: () => generateValidPeaksModel(),
        nextIndexPeaks: () => generateNextIndexPeaksModel(),
        skipIndexes: () => 1
    };
    var RealTimeBpmAnalyzer = class {
        constructor(config = {}) {
            this.options = {
                continuousAnalysis: false,
                computeBpmDelay: 1e4,
                stabilizationTime: 2e4,
                muteTimeInIndexes: 1e4
            };
            this.minValidThreshold = initialValue.minValidThreshold();
            this.timeoutStabilization = initialValue.timeoutStabilization();
            this.validPeaks = initialValue.validPeaks();
            this.nextIndexPeaks = initialValue.nextIndexPeaks();
            this.skipIndexes = initialValue.skipIndexes();
            Object.assign(this.options, config);
        }
        setAsyncConfiguration(parameters) {
            Object.assign(this.options, parameters);
        }
        reset() {
            this.minValidThreshold = initialValue.minValidThreshold();
            this.timeoutStabilization = initialValue.timeoutStabilization();
            this.validPeaks = initialValue.validPeaks();
            this.nextIndexPeaks = initialValue.nextIndexPeaks();
            this.skipIndexes = initialValue.skipIndexes();
        }
        clearValidPeaks(minThreshold) {
            return __async(this, null, function* () {
                console.log(`[clearValidPeaks] function: under ${minThreshold}, this.minValidThreshold has been setted to that threshold.`);
                this.minValidThreshold = Number.parseFloat(minThreshold.toFixed(2));
                yield descendingOverThresholds((threshold) => __async(this, null, function* () {
                    if (threshold < minThreshold) {
                        delete this.validPeaks[threshold];
                        delete this.nextIndexPeaks[threshold];
                    }
                    return false;
                }));
            });
        }
        analyzeChunck(channelData, audioSampleRate, bufferSize, postMessage) {
            return __async(this, null, function* () {
                const currentMaxIndex = bufferSize * this.skipIndexes;
                const currentMinIndex = currentMaxIndex - bufferSize;
                yield this.findPeaks(channelData, bufferSize, currentMinIndex, currentMaxIndex);
                this.skipIndexes++;
                const result = yield computeBpm(this.validPeaks, audioSampleRate);
                const { threshold } = result;
                postMessage({ message: "BPM", result });
                if (this.minValidThreshold < threshold) {
                    postMessage({ message: "BPM_STABLE", result });
                    yield this.clearValidPeaks(threshold);
                }
                if (this.options.continuousAnalysis) {
                    clearTimeout(this.timeoutStabilization);
                    this.timeoutStabilization = window.setTimeout(() => {
                        console.log("[timeoutStabilization] setTimeout: Fired !");
                        this.options.computeBpmDelay = 0;
                        this.reset();
                    }, this.options.stabilizationTime);
                }
            });
        }
        findPeaks(channelData, bufferSize, currentMinIndex, currentMaxIndex) {
            return __async(this, null, function* () {
                yield descendingOverThresholds((threshold) => __async(this, null, function* () {
                    if (this.nextIndexPeaks[threshold] >= currentMaxIndex) {
                        return false;
                    }
                    const offsetForNextPeak = this.nextIndexPeaks[threshold] % bufferSize;
                    const { peaks, threshold: atThreshold } = findPeaksAtThreshold(channelData, threshold, offsetForNextPeak);
                    if (peaks.length === 0) {
                        return false;
                    }
                    for (const relativeChunkPeak of peaks) {
                        this.nextIndexPeaks[atThreshold] = currentMinIndex + relativeChunkPeak + this.options.muteTimeInIndexes;
                        this.validPeaks[atThreshold].push(currentMinIndex + relativeChunkPeak);
                    }
                    return false;
                }), this.minValidThreshold);
            });
        }
    };

    // processor/realtime-bpm-processor.ts
    var RealTimeBpmProcessor = class extends AudioWorkletProcessor {
        constructor() {
            super();
            this.realTimeBpmAnalyzer = new RealTimeBpmAnalyzer();
            this.aggregate = chunckAggregator();
            this.port.addEventListener("message", this.onMessage.bind(this));
            this.port.start();
        }
        onMessage(event) {
            if (event.data.message === "ASYNC_CONFIGURATION") {
                this.realTimeBpmAnalyzer.setAsyncConfiguration(event.data.parameters);
            }
        }
        process(inputs, _outputs, _parameters) {
            const currentChunk = inputs[0][0];
            if (!currentChunk) {
                return true;
            }
            const { isBufferFull, buffer, bufferSize } = this.aggregate(currentChunk);
            if (isBufferFull) {
                this.realTimeBpmAnalyzer.analyzeChunck(buffer, sampleRate, bufferSize, (event) => {
                    this.port.postMessage(event);
                }).catch((error) => {
                    console.error(error);
                });
            }
            return true;
        }
    };
    registerProcessor(realtimeBpmProcessorName, RealTimeBpmProcessor);
    var realtime_bpm_processor_default = {};
})();
//# sourceMappingURL=realtime-bpm-processor.js.map
