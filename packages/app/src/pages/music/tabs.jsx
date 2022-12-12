import PlaylistsTabs from "./components/playlists"
import SpacesTabs from "./components/spaces"

export default {
    "playlists": {
        title: "Playlists",
        icon: "MdLibraryMusic",
        component: PlaylistsTabs
    },
    "spaces": {
        title: "Spaces",
        icon: "MdDeck",
        component: SpacesTabs
    },
}