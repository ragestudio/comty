// Patch global prototypes
Array.prototype.findAndUpdateObject = function (discriminator, obj) {
    let index = this.findIndex(item => item[discriminator] === obj[discriminator])
    if (index !== -1) {
        this[index] = obj
    }

    return index
}

Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0])
    return this
}

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
}

Promise.tasked = function (promises) {
    return new Promise(async (resolve, reject) => {
        let rejected = false

        for await (let promise of promises) {
            if (rejected) {
                return
            }

            try {
                await promise()
            } catch (error) {
                rejected = true
                return reject(error)
            }
        }

        if (!rejected) {
            return resolve()
        }
    })
}

import React from "react"

import { EviteRuntime } from "evite"
import { Helmet } from "react-helmet"
import * as antd from "antd"
import { Translation } from "react-i18next"

import config from "config"
import { Session, User } from "models"

import { NotFound, RenderError, Crash, Login } from "components"
import { Icons } from "components/Icons"

import Layout from "./layout"
import * as Router from "./router"

import "theme/index.less"

class App extends React.Component {
    sessionController = new Session()

    userController = new User()

    state = {
        session: null,
        user: null,
    }

    static async initialize() {
        window.app.version = config.package.version
    }

    static publicEvents = {
        "clearAllOverlays": function () {
            window.app.DrawerController.closeAll()
        },
    }

    eventsHandlers = {
        "app.close": () => {
            if (window.isElectron) {
                window.electron.ipcRenderer.invoke("app.close")
            }
        },
        "app.minimize": () => {
            if (window.isElectron) {
                window.electron.ipcRenderer.invoke("app.minimize")
            }
        },
        "app.openCreator": (...args) => {
            return App.publicMethods.openCreator(...args)
        },
        "app.createLogin": async () => {
            app.DrawerController.open("login", Login, {
                componentProps: {
                    sessionController: this.sessionController
                }
            })
        },
        "session.logout": async () => {
            await this.sessionController.logout()
        },
        "session.created": async () => {
            await this.flushState()
            await this.initialization()

            // if is `/login` move to `/`
            if (window.location.pathname === "/login") {
                app.setLocation("/")
            }
        },
        "session.destroyed": async () => {
            await this.flushState()
            app.eventBus.emit("app.forceToLogin")
        },
        "session.regenerated": async () => {
            //await this.flushState()
            //await this.initialization()
        },
        "session.invalid": async (error) => {
            const token = await Session.token

            if (!this.state.session && !token) {
                return false
            }

            await this.sessionController.forgetLocalSession()
            await this.flushState()

            app.eventBus.emit("app.forceToLogin")

            antd.notification.open({
                message: <Translation>
                    {(t) => t("Invalid Session")}
                </Translation>,
                description: <Translation>
                    {(t) => t(error)}
                </Translation>,
                icon: <Icons.MdOutlineAccessTimeFilled />,
            })
        },
        "app.forceToLogin": () => {
            window.app.setLocation("/login")
        },
        "websocket_connected": () => {
            if (this.wsReconnecting) {
                this.wsReconnectingTry = 0
                this.wsReconnecting = false

                this.initialization()

                setTimeout(() => {
                    console.log("WS Reconnected")
                }, 500)
            }
        },
        "websocket_connection_error": () => {
            if (!this.wsReconnecting) {
                this.latencyWarning = null
                this.wsReconnectingTry = 0
                this.wsReconnecting = true

                console.log("WS Reconnecting")
            }

            this.wsReconnectingTry = this.wsReconnectingTry + 1

            if (this.wsReconnectingTry > 3 && app.settings.get("app.reloadOnWSConnectionError")) {
                window.location.reload()
            }
        },
        "websocket_latency_too_high": () => {
            if (!this.latencyWarning) {
                this.latencyWarning = true

                antd.notification.open({
                    message: <Translation>
                        {(t) => t("Latency Warning")}
                    </Translation>,
                    description: <Translation>
                        {(t) => t("The latency between your computer and the server is too high. This may cause some issues. Please check your internet connection.")}
                    </Translation>,
                    icon: <Icons.MdOutlineAccessTimeFilled />,
                })
            }
        },
        "websocket_latency_normal": () => {
            if (this.latencyWarning) {
                this.latencyWarning = null

                antd.notification.close("latency-warning")
            }
        },
    }

    static staticRenders = {
        PageLoad: () => {
            return <antd.Skeleton active />
        },
        NotFound: (props) => {
            return <NotFound />
        },
        RenderError: (props) => {
            return <RenderError {...props} />
        },
        Crash: Crash.CrashWrapper,
        Initialization: () => {
            return <div className="app_splash_wrapper">
                <div className="splash_logo">
                    <img src={config.logo.alt} />
                </div>
                <div className="splash_label">
                    <Icons.LoadingOutlined />
                </div>
            </div>
        }
    }

    static publicMethods = {

    }

    constructor(props) {
        super(props)

        Object.keys(this.eventsHandlers).forEach((event) => {
            app.eventBus.on(event, this.eventsHandlers[event])
        })
    }

    flushState = async () => {
        await this.setState({ session: null, user: null })
    }

    componentDidMount = async () => {
        app.eventBus.emit("app.initialization.start")

        await this.initialization()

        app.eventBus.emit("app.initialization.finish")
    }

    initialization = async () => {
        console.debug(`[App] Initializing app`)

        const initializationTasks = [
            async () => {
                try {
                    // get remotes origins from config
                    const defaultRemotes = config.remotes

                    // get storaged	remotes origins
                    const storedRemotes = await app.settings.get("remotes") ?? {}

                    // mount main api bridge
                    await this.props.cores.ApiCore.connectBridge("main", {
                        origin: storedRemotes.mainApi ?? defaultRemotes.mainApi,
                        locked: true,
                    })

                    await this.props.cores.ApiCore.namespaces["main"].initialize()

                    app.eventBus.emit("app.initialization.api_success")
                } catch (error) {
                    app.eventBus.emit("app.initialization.api_error", error)
                    console.error(`[App] Error while initializing api`, error)

                    throw {
                        cause: "Cannot connect to API",
                        details: `Sorry but we cannot connect to the API. Please try again later. [${config.remotes.mainApi}]`,
                    }
                }
            },
            async () => {
                try {
                    await this.__SessionInit()

                    app.eventBus.emit("app.initialization.session_success")
                } catch (error) {
                    app.eventBus.emit("app.initialization.session_error", error)

                    throw {
                        cause: "Cannot initialize session",
                        details: error.message,
                    }
                }
            },
            async () => {
                try {
                    await this.__UserInit()

                    app.eventBus.emit("app.initialization.user_success")
                } catch (error) {
                    app.eventBus.emit("app.initialization.user_error", error)

                    throw {
                        cause: "Cannot initialize user data",
                        details: error.message,
                    }
                }
            },
        ]

        await Promise.tasked(initializationTasks).catch((reason) => {
            console.error(`[App] Initialization failed: ${reason.cause}`)
            app.eventBus.emit("runtime.crash", {
                message: `App initialization failed (${reason.cause})`,
                details: reason.details,
            })
        })
    }

    __SessionInit = async () => {
        const token = await Session.token

        if (!token || token == null) {
            app.eventBus.emit("app.forceToLogin")
            return false
        }

        const session = await this.sessionController.getCurrentSession().catch((error) => {
            console.error(`[App] Cannot get current session: ${error.message}`)
            return false
        })

        await this.setState({ session })
    }

    __UserInit = async () => {
        if (!this.state.session) {
            return false
        }

        const user = await User.data()
        await this.setState({ user })
    }

    render() {
        return <React.Fragment>
            <Helmet>
                <title>{config.app.siteName}</title>
            </Helmet>
            <Router.InternalRouter>
                <Layout
                    user={this.state.user}
                    staticRenders={App.staticRenders}
                    bindProps={{
                        staticRenders: App.staticRenders,
                        user: this.state.user,
                        session: this.state.session,
                        sessionController: this.sessionController,
                        userController: this.userController,
                    }}
                >
                    <Router.PageRender />
                </Layout>
            </Router.InternalRouter>
        </React.Fragment>
    }
}

export default new EviteRuntime(App)