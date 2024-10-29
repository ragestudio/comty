import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import WidgetsWrapper from "@components/WidgetsWrapper"

import "./index.less"

export default class ToolsBar extends React.Component {
    state = {
        visible: false,
        renders: {
            top: [],
            bottom: [],
        },
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
        attachRender: (id, component, props, { position = "bottom" } = {}) => {
            this.setState((prev) => {
                prev.renders[position].push({
                    id: id,
                    component: component,
                    props: props,
                })

                return prev
            })

            return component
        },
        detachRender: (id) => {
            this.setState({
                renders: {
                    top: this.state.renders.top.filter((render) => render.id !== id),
                    bottom: this.state.renders.bottom.filter((render) => render.id !== id),
                },
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
                        <div className="attached_renders top">
                            {
                                this.state.renders.top.map((render, index) => {
                                    return React.createElement(render.component, {
                                        ...render.props,
                                        key: index,
                                    })
                                })
                            }
                        </div>

                        <WidgetsWrapper />

                        <div className="attached_renders bottom">
                            {
                                this.state.renders.bottom.map((render, index) => {
                                    return React.createElement(render.component, {
                                        ...render.props,
                                        key: index,
                                    })
                                })
                            }
                        </div>
                    </div>
                </div>
            }}
        </Motion>
    }
}