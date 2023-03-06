import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"

import { Icons, createIconRender } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends, PostCard } from "components"

import Tabs from "./posts/tabs"

import "./index.less"

const defaultTab = "feed"

export default class Dashboard extends React.Component {
    state = {
        activeTab: this.props.query.type ?? defaultTab,
        openPost: null,
    }

    primaryPanelRef = React.createRef()

    renderActiveTab = () => {
        const tab = Tabs[this.state.activeTab]

        if (!tab) {
            this.setState({ activeTab: defaultTab }, () => this.replaceQueryTypeToCurrentTab())

            return
        }

        return React.createElement(tab.component, {
            onOpenPost: this.onOpenPost,
        })
    }

    handleTabChange = (key) => {
        if (this.state.activeTab === key) return

        // set to primary panel fade-opacity-leave class
        this.primaryPanelRef.current.classList.add("fade-opacity-leave")

        setTimeout(() => {
            this.setState({ activeTab: key })
            this.replaceQueryTypeToCurrentTab()
        }, 200)

        // remove fade-opacity-leave class after animation
        setTimeout(() => {
            this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
        }, 300)
    }

    replaceQueryTypeToCurrentTab = () => {
        app.history.replace(`${window.location.pathname}?type=${this.state.activeTab}`)
    }

    onOpenPost = (to, data) => {
        console.log("onOpenPost", to, data)

        this.setState({
            openPost: to ? data : null,
        })
    }

    render() {
        return <div className="postingDashboard">
            <div className="panel left">
                <div className="card" id="browserType">
                    <div className="header">
                        <h1>
                            <Icons.MdTag />
                            <Translation>{(t) => t("Posts")}</Translation>
                        </h1>
                        <antd.Button
                            type="primary"
                            onClick={app.controls.openPostCreator}
                        >
                            <Icons.PlusCircle />
                            <Translation>{(t) => t("Create")}</Translation>
                        </antd.Button>
                    </div>

                    <antd.Menu
                        mode="vertical"
                        selectedKeys={[this.state.activeTab]}
                        activeKey={this.state.activeTab}
                        onClick={({ key }) => this.handleTabChange(key)}
                    >
                        {
                            Object.keys(Tabs).map((key) => {
                                const tab = Tabs[key]

                                return <antd.Menu.Item
                                    key={key}
                                    icon={createIconRender(tab.icon)}
                                >
                                    {tab.title}
                                </antd.Menu.Item>
                            })
                        }
                    </antd.Menu>
                </div>
            </div>

            <div
                ref={this.primaryPanelRef}
                className={classnames("panel", "fade-opacity-active")}
            >
                {this.renderActiveTab()}
            </div>

            <div className="panel right">
                <div className="card" id="trendings">
                    <div className="header">
                        <h2>
                            <Icons.TrendingUp />
                            <Translation>{(t) => t("Trendings")}</Translation>
                        </h2>
                    </div>

                    <HashtagTrendings />
                </div>

                <div className="card" id="onlineFriends">
                    <div className="header">
                        <h2>
                            <Icons.Rss />
                            <Translation>{(t) => t("Online Friends")}</Translation>
                        </h2>
                    </div>

                    <ConnectedFriends />
                </div>

                <FeaturedEventsAnnouncements />
            </div>
        </div>
    }
}