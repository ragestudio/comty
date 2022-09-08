import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons, createIconRender } from "components/Icons"

import { PostCreator, PostsFeed, LivestreamsBrowser, HashtagTrendings } from "components"

import "./index.less"

const Tabs = {
    "feed": {
        title: "Feed",
        icon: "Rss",
        component: (props) => {
            return <>
                <PostCreator />
                <PostsFeed />
            </>
        }
    },
    "livestrems": {
        title: "Livestrems",
        icon: "Tv",
        component: (props) => {
            return <>
                <LivestreamsBrowser />
            </>
        }
    },
}

export default class Dashboard extends React.Component {
    state = {
        activeTab: "feed"
    }

    primaryPanelRef = React.createRef()

    componentDidMount() {
        app.eventBus.emit("style.compactMode", false)
    }

    renderActiveTab() {
        const tab = Tabs[this.state.activeTab]

        if (!tab) {
            return null
        }

        return React.createElement(tab.component)
    }

    handleTabChange = (key) => {
        if (this.state.activeTab === key) return

        // set to primary panel fade-opacity-leave class
        this.primaryPanelRef.current.classList.add("fade-opacity-leave")


        setTimeout(() => {
            this.setState({ activeTab: key })
        }, 200)

        // remove fade-opacity-leave class after animation
        setTimeout(() => {
            this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
        }, 300)
    }

    render() {
        return <div className="dashboard">
            <div></div>

            <div
                ref={this.primaryPanelRef}
                className={classnames("panel", "fade-opacity-active")}
                style={{ width: "102%" }}
            >
                {this.renderActiveTab()}
            </div>

            <div className="panel">
                <div className="card" id="browserType">
                    <h2><Icons.Compass /> Browse</h2>
                    <antd.Menu
                        mode="inline"
                        selectedKeys={[this.state.activeTab]}
                        activeKey={this.state.activeTab}
                        onClick={({ key }) => this.handleTabChange(key)}
                    >
                        {Object.keys(Tabs).map((key) => {
                            const tab = Tabs[key]

                            return <antd.Menu.Item
                                key={key}
                                icon={createIconRender(tab.icon)}
                            >
                                {tab.title}
                            </antd.Menu.Item>
                        })}
                    </antd.Menu>
                </div>

                <div className="card" id="trendings">
                    <h2><Icons.TrendingUp /> Trendings</h2>
                    <HashtagTrendings />
                </div>
            </div>
        </div>
    }
}