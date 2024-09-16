import FeedTab from "./components/feed"
import GlobalTab from "./components/global"
import SavedPostsTab from "./components/savedPosts"

export default [
    {
        key: "feed",
        label: "Feed",
        icon: "IoMdPaper",
        component: FeedTab
    },
    {
        key: "global",
        label: "Global",
        icon: "FiGlobe",
        component: GlobalTab
    },
    {
        key: "savedPosts",
        label: "Saved posts",
        icon: "FiBookmark",
        component: SavedPostsTab
    }
]