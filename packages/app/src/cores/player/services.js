import SyncModel from "comty.js/models/sync"
import MusicModel from "comty.js/models/music"

export default {
    "default": {
        resolve: async (track_id) => {
            return await MusicModel.getTrackData(track_id)
        },
        resolveMany: async (track_ids, options) => {
            const response = await MusicModel.getTrackData(track_ids, options)

            if (response.list) {
                return response
            }

            return [response]
        },
        toggleLike: async (manifest, to) => {
            return await MusicModel.toggleTrackLike(manifest, to)
        }
    },
    "tidal": {
        resolve: async (manifest) => {
            const resolvedManifest = await SyncModel.tidalCore.getTrackManifest(manifest.id)

            manifest.source = resolvedManifest.playback.url

            if (!manifest.metadata) {
                manifest.metadata = {}
            }

            manifest.metadata.title = resolvedManifest.metadata.title
            manifest.metadata.artist = resolvedManifest.metadata.artists.map(artist => artist.name).join(", ")
            manifest.metadata.album = resolvedManifest.metadata.album.title

            const coverUID = resolvedManifest.metadata.album.cover.replace(/-/g, "/")

            manifest.metadata.cover = `https://resources.tidal.com/images/${coverUID}/1280x1280.jpg`

            return manifest
        },
        toggleLike: async (manifest, to) => {
            return await MusicModel.toggleTrackLike(manifest, to)
        }
    }
}