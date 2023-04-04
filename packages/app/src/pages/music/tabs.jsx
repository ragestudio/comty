import FeedTab from "./components/feed"
import SpacesTab from "./components/spaces"

import DashboardTab from "./components/dashboard"
import ReleasesTab from "./components/dashboard/releases"

export default [
    {
        key: "feed",
        label: "Feed",
        icon: "Compass",
        component: FeedTab
    },
    {
        key: "radio",
        label: "Radio",
        icon: "Radio",
        disabled: true
    },
    {
        key: "library",
        label: "Library",
        icon: "MdLibraryMusic",
        component: FeedTab,
        disabled: true
    },
    {
        key: "spaces",
        label: "Spaces",
        icon: "MdDeck",
        component: SpacesTab,
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