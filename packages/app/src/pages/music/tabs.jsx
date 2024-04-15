import LibraryTab from "./components/library"
import FavoritesTab from "./components/favorites"
import ExploreTab from "./components/explore"

export default [
    {
        key: "explore",
        label: "Explore",
        icon: "Compass",
        component: ExploreTab
    },
    {
        key: "library",
        label: "Library",
        icon: "MdLibraryMusic",
        component: LibraryTab,
    },
    {
        key: "favorites",
        label: "Favorites",
        icon: "MdFavoriteBorder",
        component: FavoritesTab,
    },
    {
        key: "radio",
        label: "Radio",
        icon: "Radio",
        disabled: true
    },
]