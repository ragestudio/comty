import SyncModel from "comty.js/models/sync"

export default {
    "tidal": async (manifest) => {
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
    }
}