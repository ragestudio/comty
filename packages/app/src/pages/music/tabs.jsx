import FeedTab from "./components/feed"
import SpacesTabs from "./components/spaces"

export default {
    "feed": {
        title: "Feed",
        icon: "Compass",
        component: FeedTab
    },
    "library": {
        title: "Library",
        icon: "MdLibraryMusic",
        component: FeedTab
    },
    "dashboard": {
        title: "Dashboard",
        icon: "MdOutlineDashboard",
        component: FeedTab
    },
    "spaces": {
        title: "Spaces",
        icon: "MdDeck",
        component: SpacesTabs
    },
}