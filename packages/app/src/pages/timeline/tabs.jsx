import FeedTab from "./components/feed"
import GlobalTab from "./components/global"
import SavedPostsTab from "./components/savedPosts"

export default [
	{
		key: "feed",
		label: "Feed",
		icon: "Newspaper",
		component: FeedTab,
	},
	{
		key: "global",
		label: "Global",
		icon: "Earth",
		component: GlobalTab,
	},
	{
		key: "savedPosts",
		label: "Saved",
		icon: "Bookmark",
		component: SavedPostsTab,
	},
]
