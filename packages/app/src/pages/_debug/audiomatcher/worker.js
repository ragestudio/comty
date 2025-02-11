self.onmessage = async (event) => {
    const { videoBuffer, audioBuffer } = event.data;
    const SAMPLE_RATE = 44100;

    // Extraer energía en rango de frecuencias
    const getEnergy = (buffer, freqRange) => {
        const offlineCtx = new OfflineAudioContext(1, buffer.length, SAMPLE_RATE);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        
        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = 4096;
        source.connect(analyser);
        analyser.connect(offlineCtx.destination);
        source.start();
        
        return offlineCtx.startRendering().then(() => {
            const data = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(data);
            
            const startBin = Math.floor(freqRange[0] * analyser.fftSize / SAMPLE_RATE);
            const endBin = Math.floor(freqRange[1] * analyser.fftSize / SAMPLE_RATE);
            return data.slice(startBin, endBin);
        });
    };

    // Cross-correlación optimizada
    const crossCorrelate = (videoFeatures, audioFeatures) => {
        let maxCorr = -Infinity;
        let bestOffset = 0;
        
        for (let i = 0; i < videoFeatures.length - audioFeatures.length; i++) {
            let corr = 0;
            for (let j = 0; j < audioFeatures.length; j++) {
                corr += videoFeatures[i + j] * audioFeatures[j];
            }
            if (corr > maxCorr) {
                maxCorr = corr;
                bestOffset = i;
            }
        }
        return bestOffset;
    };

    // Procesar características
    try {
        const [videoBass, audioBass] = await Promise.all([
            getEnergy(videoBuffer, [60, 250]),   // Bajos
            getEnergy(audioBuffer, [60, 250])
        ]);
        
        const [videoVoice, audioVoice] = await Promise.all([
            getEnergy(videoBuffer, [300, 3400]), // Voces
            getEnergy(audioBuffer, [300, 3400])
        ]);

        // Combinar características (peso dinámico)
        const isElectronic = audioVoice.reduce((a, b) => a + b) < audioBass.reduce((a, b) => a + b);
        const weight = isElectronic ? 0.8 : 0.4;
        
        const videoFeatures = videoBass.map((v, i) => weight * v + (1 - weight) * videoVoice[i]);
        const audioFeatures = audioBass.map((v, i) => weight * v + (1 - weight) * audioVoice[i]);

        // Calcular offset
        const offset = crossCorrelate(videoFeatures, audioFeatures);
        self.postMessage({ offset: offset / SAMPLE_RATE });
    } catch (error) {
        self.postMessage({ error: "Error en el procesamiento" });
    }
};