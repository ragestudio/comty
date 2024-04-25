import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { ActionSheet } from "antd-mobile"
import { Motion, spring } from "react-motion"

import { Icons, createIconRender } from "@components/Icons"

import { WithPlayerContext, Context } from "@contexts/WithPlayerContext"

import { QuickNavMenuItems, QuickNavMenu } from "@components/Layout/quickNav"

import PlayerView from "@pages/@mobile-views/player"
import CreatorView from "@pages/@mobile-views/creator"

import "./index.less"

const tourSteps = [
    {
        title: "Quick nav",
        description: "Tap & hold on the icon to open the navigation menu.",
        placement: "top",
        refName: "navBtnRef",
    },
    {
        title: "Account button",
        description: "Tap & hold on the account icon to open miscellaneous options.",
        placement: "top",
        refName: "accountBtnRef",
    }
]

const openPlayerView = () => {
    app.DrawerController.open("player", PlayerView)
}
const openCreator = () => {
    app.DrawerController.open("creator", CreatorView, {
        props: {
            bodyStyle: {
                minHeight: "unset",
                height: "50vh"
            }
        }
    })
}

const PlayerButton = (props) => {
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

const AccountButton = React.forwardRef((props, ref) => {
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
                {
                    key: "account",
                    text: <><Icons.User /> <span>Account</span></>,
                    onClick: () => {
                        app.navigation.goToAccount()
                        ActionSheetRef.current.close()
                    }
                },
                {
                    key: "logout",
                    text: <><Icons.MdOutlineLogout /> <span>Logout</span></>,
                    danger: true,
                    onClick: () => {
                        app.eventBus.emit("app.logout_request")
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
        ref={ref}
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
})

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
        visible: false,
        quickNavVisible: false,
        render: null,
        tourOpen: false,
    }

    busEvents = {
        "runtime.crash": () => {
            this.toggleVisibility(false)
        }
    }

    navBtnRef = React.createRef()
    accountBtnRef = React.createRef()

    componentDidMount = () => {
        this.interface = app.layout.bottom_bar = {
            toggleVisible: this.toggleVisibility,
            isVisible: () => this.state.visible,
            render: (fragment) => {
                this.setState({ render: fragment })
            },
            clear: () => {
                this.setState({ render: null })
            },
            toggleTour: () => {
                this.setState({ tourOpen: !this.state.tourOpen })
            },
        }

        setTimeout(() => {
            this.setState({ visible: true })
        }, 10)

        // Register bus events
        Object.keys(this.busEvents).forEach((key) => {
            app.eventBus.on(key, this.busEvents[key])
        })

        setTimeout(() => {
            const isTourFinished = localStorage.getItem("mobile_tour")

            if (!isTourFinished) {
                this.toggleTour(true)

                localStorage.setItem("mobile_tour", true)
            }
        }, 500)
    }

    componentWillUnmount = () => {
        delete window.app.layout.bottom_bar

        // Unregister bus events
        Object.keys(this.busEvents).forEach((key) => {
            app.eventBus.off(key, this.busEvents[key])
        })
    }

    getTourSteps = () => {
        return tourSteps.map((step) => {
            step.target = () => this[step.refName].current

            return step
        })
    }

    toggleVisibility = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.visible
        }

        this.setState({ visible: to })
    }

    handleItemClick = (item) => {
        if (item.dispatchEvent) {
            app.eventBus.emit(item.dispatchEvent)
        } else if (item.location) {
            app.location.push(item.location)
        }
    }

    handleNavTouchStart = (e) => {
        this._navTouchStart = setTimeout(() => {
            this.setState({ quickNavVisible: true })

            if (app.cores.haptics?.vibrate) {
                app.cores.haptics.vibrate(80)
            }

            // remove the timeout
            this._navTouchStart = null
        }, 400)
    }

    handleNavTouchEnd = (event) => {
        if (this._lastHovered) {
            this._lastHovered.classList.remove("hover")
        }

        if (this._navTouchStart) {
            clearTimeout(this._navTouchStart)

            this._navTouchStart = null

            return false
        }

        this.setState({ quickNavVisible: false })

        // get cords of the touch
        const x = event.changedTouches[0].clientX
        const y = event.changedTouches[0].clientY

        // get the element at the touch
        const element = document.elementFromPoint(x, y)

        // get the closest element with the attribute
        const closest = element.closest(".quick-nav_item")

        if (!closest) {
            return false
        }

        const item = QuickNavMenuItems.find((item) => {
            return item.id === closest.getAttribute("quicknav-item")
        })

        if (!item) {
            return false
        }

        if (item.location) {
            app.location.push(item.location)

            if (app.cores.haptics?.vibrate) {
                app.cores.haptics.vibrate([40, 80])
            }
        }
    }

    handleNavTouchMove = (event) => {
        // check if the touch is hovering a quicknav item
        const x = event.changedTouches[0].clientX
        const y = event.changedTouches[0].clientY

        // get the element at the touch
        const element = document.elementFromPoint(x, y)

        // get the closest element with the attribute
        const closest = element.closest("[quicknav-item]")

        if (!closest) {
            if (this._lastHovered) {
                this._lastHovered.classList.remove("hover")
            }

            this._lastHovered = null

            return false
        }

        if (this._lastHovered !== closest) {
            if (this._lastHovered) {
                this._lastHovered.classList.remove("hover")
            }

            this._lastHovered = closest

            closest.classList.add("hover")

            if (app.cores.haptics?.vibrate) {
                app.cores.haptics.vibrate(40)
            }
        }
    }

    toggleTour = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.tourOpen
        }

        this.setState({
            tourOpen: to
        })
    }

    render() {
        if (this.state.render) {
            return <div className="bottomBar">
                {this.state.render}
            </div>
        }

        const heightValue = this.state.visible ? Number(app.cores.style.defaultVar("bottom-bar-height").replace("px", "")) : 0

        return <>
            {
                this.state.tourOpen && <antd.Tour
                    open
                    steps={this.getTourSteps()}
                    onClose={() => this.setState({ tourOpen: false })}
                />
            }
            <QuickNavMenu
                visible={this.state.quickNavVisible}
            />

            <Motion style={{
                y: spring(this.state.visible ? 0 : 300),
                height: spring(heightValue)
            }}>
                {({ y, height }) =>
                    <div className="bottomBar_wrapper">
                        <div
                            className="bottomBar"
                            style={{
                                WebkitTransform: `translateY(${y}px)`,
                                transform: `translateY(${y}px)`,
                                height: `${height}px`,
                            }}
                        >
                            <div className="items">
                                <div
                                    key="creator"
                                    id="creator"
                                    className={classnames("item", "primary")}
                                    onClick={openCreator}
                                >
                                    <div className="icon">
                                        {createIconRender("PlusCircle")}
                                    </div>
                                </div>

                                {
                                    this.context.track_manifest && <div
                                        className="item"
                                    >
                                        <PlayerButton
                                            manifest={this.context.track_manifest}
                                            playback={this.context.playback_status}
                                            colorAnalysis={this.context.track_manifest?.cover_analysis}
                                        />
                                    </div>
                                }

                                <div
                                    key="navigator"
                                    id="navigator"
                                    className="item"
                                    ref={this.navBtnRef}
                                    onClick={() => app.location.push("/")}
                                    onTouchMove={this.handleNavTouchMove}
                                    onTouchStart={this.handleNavTouchStart}
                                    onTouchEnd={this.handleNavTouchEnd}
                                    onTouchCancel={() => {
                                        this.setState({ quickNavVisible: false })
                                    }}
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

                                <AccountButton
                                    ref={this.accountBtnRef}
                                />
                            </div>
                        </div>
                    </div>
                }
            </Motion>
        </>
    }
}