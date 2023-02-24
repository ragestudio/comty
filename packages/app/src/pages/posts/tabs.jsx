import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import TrendingsTab from "./components/trendings"
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
    "trendings": {
        title: "Trendings",
        icon: "TrendingUp",
        component: TrendingsTab
    },
    "savedPosts": {
        title: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsTab
    }
}