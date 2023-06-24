import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

const connectionsTooltipStrings = {
    secure: "This connection is secure",
    insecure: "This connection is insecure, cause it's not using HTTPS protocol and the server cannot be verified on the trusted certificate authority.",
    warning: "This connection is secure but the server cannot be verified on the trusted certificate authority.",
}

const Footer = () => {
    const isDevMode = window.__evite?.env?.NODE_ENV !== "production"

    return <div className="footer">
        <div>
            <div>{config.app?.siteName}</div>
            <div>
                <antd.Tag>
                    <Icons.Tag />v{window.app.version}
                </antd.Tag>
            </div>
            <div>
                <antd.Tag color={isDevMode ? "magenta" : "green"}>
                    {isDevMode ? <Icons.Triangle /> : <Icons.Box />}
                    {isDevMode ? "development" : "production"}
                </antd.Tag>
            </div>
        </div>
    </div>
}

const latencyToColor = (latency, type) => {
    switch (type) {
        case "http": {
            if (latency < 100) {
                return "green"
            }
            if (latency < 200) {
                return "orange"
            }
            return "red"
        }
        case "ws": {
            if (latency < 80) {
                return "green"
            }
            if (latency < 120) {
                return "orange"
            }
            return "red"
        }
    }
}

export default {
    id: "about",
    icon: "Info",
    label: "About",
    group: "bottom",
    render: () => {
        const isProduction = import.meta.env.PROD

        const [serverManifest, setServerManifest] = React.useState(null)
        const [serverOrigin, setServerOrigin] = React.useState(null)
        const [serverHealth, setServerHealth] = React.useState(null)
        const [secureConnection, setSecureConnection] = React.useState(false)
        const [connectionPing, setConnectionPing] = React.useState({})

        const checkServerVersion = async () => {
            const serverManifest = await app.cores.api.customRequest()

            setServerManifest(serverManifest.data)
        }

        const checkServerOrigin = async () => {
            const instance = app.cores.api.instance()

            if (instance) {
                setServerOrigin(instance.mainOrigin)

                if (instance.mainOrigin.startsWith("https")) {
                    setSecureConnection(true)
                }
            }
        }

        const fetchServerHealth = async () => {
            const response = await app.cores.api.customRequest({
                method: "GET",
                url: "/server/health",
            }).catch(() => null)

            console.log(response.data)

            if (response) {
                setServerHealth(response.data)
            }
        }

        const measurePing = async () => {
            const result = await app.cores.api.measurePing()

            console.log(result)

            setConnectionPing(result)
        }

        React.useEffect(() => {
            checkServerVersion()
            checkServerOrigin()

            fetchServerHealth()
            measurePing()

            const measureInterval = setInterval(() => {
                fetchServerHealth()
                measurePing()
            }, 3000)

            return () => {
                clearInterval(measureInterval)
            }
        }, [])

        return <div className="about_app">
            <div className="header">
                <div className="branding">
                    <div className="logo">
                        <img
                            src={config.logo.alt}
                            alt="Logo"
                        />
                    </div>
                    <div className="texts">
                        <h2>{config.app.siteName}</h2>
                        <span>{config.author}</span>
                        <span> Licensed with {config.package?.license ?? "unlicensed"} </span>
                    </div>
                </div>
                <div className="versions">
                    <antd.Tag><Icons.Tag />v{window.app.version ?? "experimental"}</antd.Tag>
                    <antd.Tag color={isProduction ? "green" : "magenta"}>
                        {isProduction ? <Icons.CheckCircle /> : <Icons.Triangle />}
                        {String(import.meta.env.MODE)}
                    </antd.Tag>
                </div>
            </div>

            <div className="group">
                <div className="group_header">
                    <h3><Icons.Info />Server information</h3>
                </div>

                <div className="field">
                    <div className="field_header">
                        <h3><Icons.MdOutlineStream /> Origin</h3>

                        <antd.Tooltip
                            title={secureConnection ? connectionsTooltipStrings.secure : connectionsTooltipStrings.insecure}
                        >
                            <antd.Tag
                                color={secureConnection ? "green" : "red"}
                                icon={secureConnection ? <Icons.MdHttps /> : <Icons.MdWarning />}
                            >
                                {
                                    secureConnection ? " Secure connection" : "Insecure connection"
                                }
                            </antd.Tag>
                        </antd.Tooltip>
                    </div>

                    <div className="field_value">
                        {serverOrigin ?? "Unknown"}
                    </div>
                </div>

                <div className="field">
                    <div className="field_header">
                        <h3><Icons.MdOutlineMemory /> Instance Performance</h3>
                    </div>

                    <div className="field_value">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "1.4rem",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Icons.MdHttp />
                                <antd.Tag
                                    color={latencyToColor(connectionPing?.http, "http")}
                                >
                                    {connectionPing?.http}ms
                                </antd.Tag>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Icons.MdSettingsEthernet />
                                <antd.Tag
                                    color={latencyToColor(connectionPing?.ws, "ws")}
                                >
                                    {connectionPing?.ws}ms
                                </antd.Tag>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <div className="field_header">
                        <h3><Icons.MdDataUsage /> Instance usage</h3>
                    </div>

                    <div className="field_value">
                        <antd.Progress
                            percent={serverHealth?.cpuUsage.percent ?? 0}
                            status="active"
                            showInfo={false}
                        />
                    </div>
                </div>

                <div className="inline_field">
                    <div className="field_header">
                        <div className="field_icon">
                            <Icons.MdBuild />
                        </div>

                        <p>Version</p>
                    </div>

                    <div className="field_value">
                        {serverManifest?.version ?? "Unknown"}
                    </div>
                </div>
            </div>

            <div className="group">
                <div className="inline_field">
                    <div className="field_header">
                        <div className="field_icon">
                            <Icons.MdInfo />
                        </div>

                        <p>React</p>
                    </div>

                    <div className="field_value">
                        {React.version ?? "Unknown"}
                    </div>
                </div>

                <div className="inline_field">
                    <div className="field_header">
                        <div className="field_icon">
                            <Icons.MdInfo />
                        </div>

                        <p>Evite Engine</p>
                    </div>

                    <div className="field_value">
                        {app.__eviteVersion ?? "Unknown"}
                    </div>
                </div>

                <div className="inline_field">
                    <div className="field_header">
                        <div className="field_icon">
                            <Icons.MdInfo />
                        </div>

                        <p>Comty.JS</p>
                    </div>

                    <div className="field_value">
                        {__comty_shared_state.version ?? "Unknown"}
                    </div>
                </div>

                <div className="inline_field">
                    <div className="field_header">
                        <div className="field_icon">
                            <Icons.MdInfo />
                        </div>

                        <p>Platform</p>
                    </div>

                    <div className="field_value">
                        {Capacitor.platform}
                    </div>
                </div>
            </div>
        </div>
    }
}