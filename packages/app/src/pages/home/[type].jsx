import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import { Icons, createIconRender } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends } from "components"

import Tabs from "./tabs"

import "./index.less"

export default class Dashboard extends React.Component {
    state = {
        activeTab: this.props.params.type ?? "feed"
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
                    <h2>
                        <Icons.Compass />
                        <Translation>{(t) => t("Browser")}</Translation>
                    </h2>
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
                    <h2>
                        <Icons.TrendingUp />
                        <Translation>{(t) => t("Trendings")}</Translation>
                    </h2>
                    <HashtagTrendings />
                </div>

                <div className="card" id="onlineFriends">
                    <h2>
                        <Icons.Rss />
                        <Translation>{(t) => t("Online Friends")}</Translation>
                    </h2>
                    <div className="content">
                        <ConnectedFriends />
                    </div>
                </div>

                <FeaturedEventsAnnouncements />
            </div>
        </div>
    }
}