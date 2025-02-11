import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js"

const exampleData = {
    video: "https://im-fa.manifest.tidal.com/1/manifests/CAESCTE5Njg2MTQ0NCIWd05QUkh1YTIyOGRXTUVUdmFxbThQdyIWZE05ZHNYTFNkTEhaODdmTUxQMDhGQSIWS0dfYTZubHUtcTUydVZMenRyOTJwQSIWLWU1NHRpanJlNzZhSjdMcXVoQ05idyIWenRCWnZEYmpia1hvNS14UUowWFl1USIWdFRHY20ycFNpVTktaHBtVDlzUlNvdyIWdVJDMlNqMFJQYWVMSnN6NWRhRXZtdyIWZnNYUWZpNk01LUdpeUV3dE9JNTZ2dygBMAJQAQ.m3u8?token=1738270941~MjEyMTc0MTk0NTlmNjdiY2RkNjljYzc0NzU1NGRmZDcxMGJhNDI2Mg==",
    audio: "https://sp-pr-fa.audio.tidal.com/mediatracks/CAEaKwgDEidmMmE5YjEyYTQ5ZTQ4YWFkZDdhOTY0YzBmZTdhZTY1ZV82MS5tcDQ/0.flac?token=1738270937~Y2ViYjZiNmYyZmVjN2JhNmYzN2ViMWEzOTcwNzQ3NDdkNzA5YzhhZg=="
}

function AudioSyncApp() {
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const [worker, setWorker] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const audioCtxRef = useRef(null);
    const hlsRef = useRef(null);

    // Configurar HLS para el video
    useEffect(() => {
        if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false, xhrSetup: (xhr) => xhr.withCredentials = false });
            hlsRef.current = hls;
            hls.loadSource(exampleData.video);
            hls.attachMedia(videoRef.current);
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
            videoRef.current.src = exampleData.video;
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, []);

    // Inicializar Web Audio y Worker
    useEffect(() => {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const newWorker = new Worker(new URL("./worker.js", import.meta.url));
        newWorker.onmessage = (event) => {
            setStartTime(event.data.offset);
        };
        setWorker(newWorker);

        return () => newWorker.terminate();
    }, []);

    // Manejar la sincronización
    const handleSync = async () => {
        try {
            // 1. Obtener buffers de audio
            const [videoBuffer, audioBuffer] = await Promise.all([
                fetch(exampleData.video, { mode: "cors" }).then(r => r.arrayBuffer()),
                fetch(exampleData.audio, { mode: "cors" }).then(r => r.arrayBuffer())
            ]);

            // 2. Decodificar
            const [videoAudio, songAudio] = await Promise.all([
                audioCtxRef.current.decodeAudioData(videoBuffer),
                audioCtxRef.current.decodeAudioData(audioBuffer)
            ]);

            // 3. Enviar al Worker
            worker.postMessage(
                { videoBuffer: videoAudio, audioBuffer: songAudio },
                [videoAudio, songAudio]
            );
        } catch (error) {
            console.error("Error de decodificación:", error);
        }
    };

    return (
        <div>
            <video
                ref={videoRef}
                controls
                crossOrigin="anonymous"
                width="600"
            />
            <audio
                ref={audioRef}
                controls
                crossOrigin="anonymous"
                src={exampleData.audio}
            />
            <button onClick={handleSync}>Sincronizar</button>
            {startTime !== null && (
                <p>Offset de sincronización: {startTime.toFixed(2)} segundos</p>
            )}
        </div>
    );
}

export default AudioSyncApp;