import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons, createIconRender } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends } from "components"

import FeedBrowser from "./components/feed"
import ExploreBrowser from "./components/explore"
import LivestreamsBrowser from "./components/livestreams"
import SavedPostsBrowser from "./components/savedPosts"

import "./index.less"

const Tabs = {
    "feed": {
        title: "Feed",
        icon: "Rss",
        component: FeedBrowser
    },
    "explore": {
        title: "Explore",
        icon: "Search",
        component: ExploreBrowser
    },
    "savedPosts": {
        title: "Saved posts",
        icon: "Bookmark",
        component: SavedPostsBrowser
    },
    "livestreams": {
        title: "Livestreams",
        icon: "Tv",
        component: LivestreamsBrowser
    },
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
        return <div className="dashboard">
            <div
                ref={this.primaryPanelRef}
                className={classnames("panel", "fade-opacity-active")}
                style={{ width: "102%" }}
            >
                {this.renderActiveTab()}
            </div>
        </div>
    }
}