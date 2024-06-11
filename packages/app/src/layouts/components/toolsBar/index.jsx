import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"
import { Translation } from "react-i18next"
import { Icons } from "@components/Icons"

import WidgetsWrapper from "@components/WidgetsWrapper"

import "./index.less"

export default class ToolsBar extends React.Component {
    state = {
        visible: false,
        renders: [],
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
        attachRender: (id, component, props) => {
            this.setState({
                renders: [...this.state.renders, {
                    id: id,
                    component: component,
                    props: props,
                }],
            })

            return component
        },
        detachRender: (id) => {
            this.setState({
                renders: this.state.renders.filter((render) => render.id !== id),
            })

            return true
        }
    }

    render() {
        return <Motion
            style={{
                x: spring(this.state.visible ? 0 : 100),
                width: spring(this.state.visible ? 100 : 0),
            }}
        >
            {({ x, width }) => {
                return <div
                    style={{
                        width: `${width}%`,
                        transform: `translateX(${x}%)`,
                    }}
                    className={classnames(
                        "tools-bar-wrapper",
                        {
                            visible: this.state.visible,
                        }
                    )}
                >
                    <div
                        id="tools_bar"
                        className="tools-bar"
                    >
                        {/* <div className="card" id="trendings">
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

                        <FeaturedEventsAnnouncements /> */}

                        <WidgetsWrapper />

                        <div className="attached_renders">
                            {
                                this.state.renders.map((render) => {
                                    return React.createElement(render.component, render.props)
                                })
                            }
                        </div>
                    </div>
                </div>
            }}
        </Motion>
    }
}