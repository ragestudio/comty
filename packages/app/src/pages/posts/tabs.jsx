import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import SavedPostsTab from "./components/savedPosts"

export default {
    "feed": {
        title: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "explore": {
        title: "Explore",
        icon: "Search",
        component: ExploreTab
    },
    "savedPosts": {
        title: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsTab
    }
}