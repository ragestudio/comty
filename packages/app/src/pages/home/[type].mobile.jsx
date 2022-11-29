import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import FeedTab from "./components/feed"
import ExploreTab from "./components/explore"
import TrendingsTab from "./components/trendings"
import SavedPostsTab from "./components/savedPosts"

import "./index.less"

const Tabs = {
    "feed": {
        title: "Feed",
        icon: "Rss",
        component: FeedTab
    },
    "trendings": {
        title: "Trendings",
        icon: "TrendingUp",
        component: TrendingsTab
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

export default class Dashboard extends React.Component {
    state = {
        activeTab: this.props.match.params.type ?? "feed"
    }

    primaryPanelRef = React.createRef()

    componentDidMount() {
        app.eventBus.emit("style.compactMode", false)
    }

    renderActiveTab() {
        const tab = Tabs[this.state.activeTab]

        if (!tab) {
            return <antd.Result
                status="404"
                title="404"
                subTitle="Sorry, the tab you visited does not exist."
            />
        }

        return React.createElement(tab.component)
    }

    handleTabChange = (key) => {
        if (this.state.activeTab === key) return

        // set to primary panel fade-opacity-leave class
        this.primaryPanelRef.current.classList.add("fade-opacity-leave")

        setTimeout(() => {
            this.setState({ activeTab: key })
            // update location
            app.history.replace(key)
        }, 200)

        // remove fade-opacity-leave class after animation
        setTimeout(() => {
            this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
        }, 300)
    }

    render() {
        return <div className="postingDashboard">
            <div
                ref={this.primaryPanelRef}
                className={classnames("panel", "fade-opacity-active")}
            >
                {this.renderActiveTab()}
            </div>
        </div>
    }
}