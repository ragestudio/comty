import LivestreamsList from "./tabs/livestreamsList"

export default [
    {
        key: "live",
        label: "Livestreams",
        icon: "FiRadio",
        component: LivestreamsList
    },
    {
        key: "videos",
        label: "Videos",
        icon: "FiVideo",
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
                icon: "FiUpload",
                disabled: true
            },
            {
                key: "controlPanel.streaming_settings",
                label: "Stream Configuration",
                icon: "FiSettings",
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