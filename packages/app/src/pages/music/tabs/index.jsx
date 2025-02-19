import LibraryTab from "./library"
import ExploreTab from "./explore"
import RadioTab from "./radio"

export default [
	{
		key: "explore",
		label: "Explore",
		icon: "FiCompass",
		component: ExploreTab,
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
		component: RadioTab,
	},
]
