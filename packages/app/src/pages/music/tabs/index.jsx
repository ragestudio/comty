import LibraryTab from "./library"
import ExploreTab from "./explore"
import RadioTab from "./radio"

export default [
	{
		key: "explore",
		label: "Explore",
		icon: "Compass",
		component: ExploreTab,
	},
	{
		key: "library",
		label: "Library",
		icon: "SquareLibrary",
		component: LibraryTab,
	},
	{
		key: "radio",
		label: "Radio",
		icon: "RadioTower",
		component: RadioTab,
	},
]
