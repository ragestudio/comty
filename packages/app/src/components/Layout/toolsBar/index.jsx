import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Motion, spring } from "react-motion"
import { Translation } from "react-i18next"

import { Icons } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends } from "components"
import WidgetsWrapper from "components/WidgetsWrapper"

import "./index.less"

export default class ToolsBar extends React.Component {
    state = {
        visible: false,
    }

    componentDidMount() {
        app.layout.tools_bar = this.interface

        setTimeout(() => {
            this.setState({
                visible: true,
            })
        }, 10)
    }

    componentWillUnmount() {
        delete app.layout.tools_bar
    }

    interface = {
        toggleVisibility: (to) => {
            this.setState({
                visible: to ?? !this.state.visible,
            })
        },
    }

    render() {
        return <Motion style={{
            x: spring(this.state.visible ? 0 : 100),
            width: spring(this.state.visible ? 100 : 0),
        }}>
            {({ x, width }) => {
                return <div
                    id="tools_bar"
                    className={classnames(
                        "tools-bar",
                        {
                            visible: this.state.visible,
                        }
                    )}
                    style={{
                        width: `${width}%`,
                        transform: `translateX(${x}%)`,
                    }}
                >
                    <FeaturedEventsAnnouncements />

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
                                <Icons.MdPeopleAlt />
                                <Translation>{(t) => t("Online Friends")}</Translation>
                            </h2>
                        </div>

                        <ConnectedFriends />
                    </div>

                    <WidgetsWrapper />
                </div>
            }}
        </Motion>
    }
}