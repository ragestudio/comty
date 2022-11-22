import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import { createIconRender } from "components/Icons"

import "./index.less"

export default class BottomBar extends React.Component {
    state = {
        allowed: true,
        show: true,
        visible: true,
        render: null,
    }

    busEvents = {
        "runtime.crash": () => {
            this.toggleVisibility(false)
        }
    }

    componentDidMount = () => {
        app.BottomBarController = {
            toogleVisible: this.toggleVisibility,
            isVisible: () => this.state.visible,
            render: (fragment) => {
                this.setState({ render: fragment })
            },
            clear: () => {
                this.setState({ render: null })
            },
        }

        // Register bus events
        Object.keys(this.busEvents).forEach((key) => {
            app.eventBus.on(key, this.busEvents[key])
        })
    }

    componentWillUnmount = () => {
        delete window.app.BottomBarController

        // Unregister bus events
        Object.keys(this.busEvents).forEach((key) => {
            app.eventBus.off(key, this.busEvents[key])
        })
    }

    toggleVisibility = (to) => {
        if (!window.isMobile) {
            to = false
        } else {
            to = to ?? !this.state.visible
        }

        if (!to) {
            this.setState({ show: to }, () => {
                setTimeout(() => {
                    this.setState({ visible: to })
                }, 500)
            })
        } else {
            this.setState({ visible: to }, () => {
                this.setState({ show: to })
            })
        }
    }

    onClickItemId = (id) => {
        window.app.setLocation(`/${id}`)
    }

    render() {
        if (this.state.render) {
            return <div className="bottomBar">
                {this.state.render}
            </div>
        }

        if (!this.state.visible) {
            return null
        }

        return <Motion style={{ y: spring(this.state.show ? 0 : 300) }}>
            {({ y }) => <div
                className="bottomBar"
                style={{
                    WebkitTransform: `translate3d(0, ${y}px, 0)`,
                    transform: `translate3d(0, ${y}px, 0)`,
                }}
            >
                <div className="items">
                    <div
                        key="main"
                        id="main"
                        className="item"
                        onClick={() => window.app.goMain()}
                    >
                        <div className="icon">
                            {createIconRender("Home")}
                        </div>
                    </div>
                    <div
                        key="nav"
                        id="nav"
                        className="item"
                        onClick={() => window.app.openNavigationMenu()}
                    >
                        <div className="icon">
                            {createIconRender("Navigation")}
                        </div>
                    </div>
                    <div
                        key="createNew"
                        id="createNew"
                        className={classnames("item", ["primary"])}
                        onClick={() => window.app.openCreateNew()}
                    >
                        <div className="icon">
                            {createIconRender("PlusCircle")}
                        </div>
                    </div>
                    <div
                        key="settings"
                        id="settings"
                        className="item"
                        onClick={() => window.app.openSettings()}
                    >
                        <div className="icon">
                            {createIconRender("Settings")}
                        </div>
                    </div>
                    {app.userData ? <div
                        key="account"
                        id="account"
                        className="item"
                        onClick={() => window.app.goToAccount()}
                    >
                        <div className="icon">
                            <antd.Avatar shape="square" src={app.userData.avatar} />
                        </div>
                    </div> : <div
                        key="login"
                        id="login"
                        onClick={() => this.onClickItemId("login")}
                        className="item"
                    >
                        <div className="icon">
                            {createIconRender("LogIn")}
                        </div>
                    </div>}
                </div>
            </div>}
        </Motion>
    }
}