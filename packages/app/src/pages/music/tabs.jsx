import LibraryTab from "./components/library"
import FavoritesTab from "./components/favorites"
import ExploreTab from "./components/explore"
import DashboardTab from "./components/dashboard"

import ReleasesTab from "./components/dashboard/releases"

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
    {
        key: "artist_panel",
        label: "Creator Panel",
        icon: "MdSpaceDashboard",
        component: DashboardTab,
        children: [
            {
                key: "artist_panel.releases",
                label: "Releases",
                icon: "MdUpcoming",
                component: ReleasesTab,
            }
        ]
    },
]