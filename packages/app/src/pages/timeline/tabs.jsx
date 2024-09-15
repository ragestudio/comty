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
        icon: "Globe",
        component: GlobalTab
    },
    {
        key: "savedPosts",
        label: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsTab
    }
]