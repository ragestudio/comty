import SyncModel from "comty.js/models/sync"

export default {
    "tidal": async (manifest) => {
        const resolvedManifest = await SyncModel.tidalCore.getTrackManifest(manifest.id)

        this.console.log(resolvedManifest)

        manifest.source = resolvedManifest.playback.url

        manifest.title = resolvedManifest.metadata.title
        manifest.artist = resolvedManifest.metadata.artists.map(artist => artist.name).join(", ")
        manifest.album = resolvedManifest.metadata.album.title

        const coverUID = resolvedManifest.metadata.album.cover.replace(/-/g, "/")

        manifest.cover = `https://resources.tidal.com/images/${coverUID}/1280x1280.jpg`

        return manifest
    }
}