import FeedTab from "./components/feed"
import GlobalTab from "./components/global"
import SavedPostsTab from "./components/savedPosts"

export default {
    "feed": {
        label: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "global": {
        label: "Global",
        icon: "Globe",
        component: GlobalTab
    },
    "savedPosts": {
        label: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsTab
    }
}