import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import ControlPanelTab from "./components/controlPanel"

export default {
    "feed": {
        title: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "explore": {
        title: "Explore",
        icon: "Search",
        component: ExploreTab
    },
    "controlPanel": {
        title: "Control Panel",
        icon: "Settings",
        component: ControlPanelTab
    }
}