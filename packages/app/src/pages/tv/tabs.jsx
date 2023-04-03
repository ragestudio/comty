import ExploreTab from "./components/explore"
import ControlPanelTab from "./components/controlPanel"

export default {
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