import { CapacitorMusicControls } from "capacitor-music-controls-plugin-v3"

export default class MediaSession {
    initialize() {
        CapacitorMusicControls.addListener("controlsNotification", (info) => {
            console.log(info)

            this.handleControlsEvent(info)
        })

        document.addEventListener("controlsNotification", (event) => {
            console.log(event)

            const info = { message: event.message, position: 0 }

            this.handleControlsEvent(info)
        })
    }

    update(manifest) {
        if ("mediaSession" in navigator) {
            return navigator.mediaSession.metadata = new MediaMetadata({
                title: manifest.title,
                artist: manifest.artist,
                album: manifest.album,
                artwork: [
                    {
                        src: manifest.cover ?? manifest.thumbnail,
                        sizes: "512x512",
                        type: "image/jpeg",
                    }
                ],
            })
        }

        return CapacitorMusicControls.create({
            track: manifest.title,
            artist: manifest.artist,
            album: manifest.album,
            cover: manifest.cover,

            hasPrev: false,
            hasNext: false,
            hasClose: true,

            isPlaying: true,
            dismissable: false,

            playIcon: "media_play",
            pauseIcon: "media_pause",
            prevIcon: "media_prev",
            nextIcon: "media_next",
            closeIcon: "media_close",
            notificationIcon: "notification"
        })
    }

    updateIsPlaying(to, timeElapsed = 0) {
        if ("mediaSession" in navigator) {
            return navigator.mediaSession.playbackState = to ? "playing" : "paused"
        }

        return CapacitorMusicControls.updateIsPlaying({
            isPlaying: to,
            elapsed: timeElapsed,
        })
    }

    destroy() {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "none"
        }

        this.active = false

        return CapacitorMusicControls.destroy()
    }

    handleControlsEvent(action) {
        const message = action.message

        switch (message) {
            case "music-controls-next": {
                return app.cores.player.playback.next()
            }
            case "music-controls-previous": {
                return app.cores.player.playback.previous()
            }
            case "music-controls-pause": {
                return app.cores.player.playback.pause()
            }
            case "music-controls-play": {
                return app.cores.player.playback.play()
            }
            case "music-controls-destroy": {
                return app.cores.player.playback.stop()
            }

            // External controls (iOS only)
            case "music-controls-toggle-play-pause": {
                return app.cores.player.playback.toggle()
            }

            // Headset events (Android only)
            // All media button events are listed below
            case "music-controls-media-button": {
                return app.cores.player.playback.toggle()
            }
            case "music-controls-headset-unplugged": {
                return app.cores.player.playback.pause()
            }
            case "music-controls-headset-plugged": {
                return app.cores.player.playback.play()
            }
            default:
                break;
        }
    }
}