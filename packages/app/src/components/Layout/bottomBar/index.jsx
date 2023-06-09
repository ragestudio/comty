import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { ActionSheet } from "antd-mobile"
import { Motion, spring } from "react-motion"

import { Icons, createIconRender } from "components/Icons"

import { WithPlayerContext, Context } from "contexts/WithPlayerContext"

import PlayerView from "pages/@mobile-views/player"

import "./index.less"

const PlayerButton = (props) => {
    const openPlayerView = () => {
        app.DrawerController.open("player", PlayerView)
    }

    React.useEffect(() => {
        openPlayerView()
    }, [])

    return <div
        className={classnames(
            "player_btn",
            {
                "bounce": props.playback === "playing"
            }
        )}
        style={{
            "--average-color": props.colorAnalysis?.rgba,
            "--color": props.colorAnalysis?.isDark ? "var(--text-color-white)" : "var(--text-color-black)",
        }}
        onClick={openPlayerView}
    >
        {
            props.playback === "playing" ? <Icons.MdMusicNote /> : <Icons.MdPause />
        }
    </div>
}

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
                        app.navigation.goToSettings()
                        ActionSheetRef.current.close()
                    }
                },
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

export default (props) => {
    return <WithPlayerContext>
        <BottomBar
            {...props}
        />
    </WithPlayerContext>
}

export class BottomBar extends React.Component {
    static contextType = Context

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
        if (!app.isMobile) {
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
                        key="creator"
                        id="creator"
                        className={classnames("item", "primary")}
                        onClick={() => app.setLocation("/")}
                    >
                        <div className="icon">
                            {createIconRender("PlusCircle")}
                        </div>
                    </div>

                    {
                        this.context.currentManifest && <div
                            className="item"
                        >
                            <PlayerButton
                                manifest={this.context.currentManifest}
                                playback={this.context.playbackStatus}
                                colorAnalysis={this.context.coverColorAnalysis}
                            />
                        </div>
                    }

                    <div
                        key="navigator"
                        id="navigator"
                        className="item"
                        onClick={() => app.setLocation("/")}
                    >
                        <div className="icon">
                            {createIconRender("Home")}
                        </div>
                    </div>

                    <div
                        key="searcher"
                        id="searcher"
                        className="item"
                        onClick={app.controls.openSearcher}
                    >
                        <div className="icon">
                            {createIconRender("Search")}
                        </div>
                    </div>

                    <AccountButton />
                </div>
            </div>}
        </Motion>
    }
}