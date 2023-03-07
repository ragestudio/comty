import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import SavedPostsTab from "./components/savedPosts"

export default {
    "feed": {
        label: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "explore": {
        label: "Explore",
        icon: "Search",
        component: ExploreTab
    },
    "savedPosts": {
        label: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsTab
    }
}