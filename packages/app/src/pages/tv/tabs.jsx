import FeedTab from "./tabs/feed"
import ControlPanelTab from "./tabs/livestreamControlPanel"

export default [
    {
        key: "feed",
        label: "Feed",
        icon: "Compass",
        component: FeedTab
    },
    {
        key: "controlPanel",
        label: "Creator Panel",
        icon: "MdSpaceDashboard",
        children: [
            {
                key: "controlPanel.uploads",
                label: "Uploads",
                icon: "Upload",
                disabled: true
            },
            {
                key: "controlPanel.streaming_settings",
                label: "Livestreaming",
                icon: "Settings",
                component: ControlPanelTab
            },
            {
                key: "controlPanel.dvr_settings",
                label: "DVR",
                icon: "MdFiberDvr",
                disabled: true
            }
        ]
    }
]