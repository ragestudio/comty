import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import ControlPanelTab from "./components/controlPanel"

export default {
    "feed": {
        label: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "explore": {
        label: "Explore",
        icon: "Search",
        component: ExploreTab
    },
    "controlPanel": {
        label: "Control Panel",
        icon: "Settings",
        component: ControlPanelTab
    }
}