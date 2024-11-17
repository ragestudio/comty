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
]