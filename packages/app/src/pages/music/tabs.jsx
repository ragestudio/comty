import FeedTab from "./components/feed"
import SpacesTab from "./components/spaces"
import DashboardTab from "./components/dashboard"

export default {
    "feed": {
        label: "Feed",
        icon: "Compass",
        component: FeedTab
    },
    "library": {
        label: "Library",
        icon: "MdLibraryMusic",
        component: FeedTab,
        disabled: true
    },
    "spaces": {
        label: "Spaces",
        icon: "MdDeck",
        component: SpacesTab,
        disabled: true
    },
    "artistPanel": {
        label: "Artist Panel",
        icon: "MdOutlineDashboard",
        component: DashboardTab,
    },
}