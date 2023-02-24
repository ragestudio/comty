import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { ActionSheet } from "antd-mobile"
import { Motion, spring } from "react-motion"

import { Icons, createIconRender } from "components/Icons"

import "./index.less"

const items = [
    {
        id: "creator",
        dispatchEvent: "app.openCreator",
        icon: "PlusCircle",
        classnames: [["primary"]]
    },
    {
        id: "feed",
        location: "/home/feed",
        icon: "Home",
    },
    {
        id: "explore",
        location: "/home/explore",
        icon: "Search",
    },
    {
        id: "livestreams",
        location: "/home/livestreams",
        icon: "Tv",
    }
]

const AccountButton = (props) => {
    const user = app.userData
    const ActionSheetRef = React.useRef()

    const handleClick = () => {
        if (!user) {
            return app.navigation.goAuth()
        }

        return app.navigation.goToAccount()
    }

    const handleHold = () => {
        ActionSheetRef.current = ActionSheet.show({
            actions: [
                {
                    key: "settings",
                    text: <><Icons.Settings /> <span>Settings</span></>,
                    onClick: () => {
                        app.openSettings()
                        ActionSheetRef.current.close()
                    }
                },
                {
                    key: "savedPosts",
                    text: <><Icons.Bookmark /> <span>Saved Posts</span></>,
                    onClick: () => {
                        app.setLocation("/home/savedPosts")
                        ActionSheetRef.current.close()
                    }
                },
                {
                    key: "about",
                    text: <><Icons.Info /> <span>About</span></>,
                    onClick: () => {
                        app.setLocation("/about")
                        ActionSheetRef.current.close()
                    }
                }
            ]
        })
    }

    return <div
        key="account"
        id="account"
        className="item"
        onClick={handleClick}
        onContextMenu={handleHold}
        context-menu="ignore"
    >
        <div className="icon">
            {
                user ? <antd.Avatar shape="square" src={app.userData.avatar} /> : createIconRender("Login")
            }
        </div>
    </div>
}

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

    handleItemClick = (item) => {
        if (item.dispatchEvent) {
            app.eventBus.emit(item.dispatchEvent)
        } else if (item.location) {
            app.setLocation(item.location)
        }
    }

    renderItems = () => {
        return items.map((item) => {
            return <div
                key={item.id}
                id={item.id}
                className={classnames("item", ...item.classnames ?? [])}
                onClick={() => this.handleItemClick(item)}
            >
                <div className="icon">
                    {createIconRender(item.icon)}
                </div>
            </div>
        })
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
                    {this.renderItems()}
                    <AccountButton />
                </div>
            </div>}
        </Motion>
    }
}