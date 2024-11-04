import LibraryTab from "./library"
import ExploreTab from "./explore"

export default [
    {
        key: "explore",
        label: "Explore",
        icon: "FiCompass",
        component: ExploreTab
    },
    {
        key: "library",
        label: "Library",
        icon: "MdLibraryMusic",
        component: LibraryTab,
    },
    {
        key: "radio",
        label: "Radio",
        icon: "FiRadio",
        disabled: true
    },
]