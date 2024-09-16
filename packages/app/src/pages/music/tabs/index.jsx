import LibraryTab from "./library"
import FavoritesTab from "./favorites"
import ExploreTab from "./explore"

export default [
    {
        key: "explore",
        label: "Explore",
        icon: "FiCompass",
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
        icon: "FiRadio",
        disabled: true
    },
]