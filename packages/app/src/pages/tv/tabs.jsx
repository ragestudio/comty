import LivestreamsList from "./tabs/livestreamsList"

export default [
    {
        key: "live",
        label: "Livestreams",
        icon: "Radio",
        component: LivestreamsList
    },
    {
        key: "videos",
        label: "Videos",
        icon: "Video",
        component: LivestreamsList,
        disabled: true,
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
                label: "Stream Configuration",
                icon: "Settings",
                disabled: true,
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