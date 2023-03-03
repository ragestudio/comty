import React from "react"
import * as antd from "antd"
import moment from "moment"

import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

const Footer = (props) => {
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

export default {
    id: "about",
    icon: "Info",
    label: "About",
    group: "bottom",
    render: () => {
        const isProduction = import.meta.env.PROD

        const [serverManifest, setServerManifest] = React.useState(null)
        const [serverOrigin, setServerOrigin] = React.useState(null)

        const checkServerVersion = async () => {
            const serverManifest = await app.cores.api.customRequest()

            setServerManifest(serverManifest.data)
        }

        const checkServerOrigin = async () => {
            const instance = app.cores.api.instance()

            if (instance) {
                setServerOrigin(instance.origin)
            }
        }

        React.useEffect(() => {
            checkServerVersion()
            checkServerOrigin()
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
                <h3><Icons.Server />Server info</h3>

                <div className="field">
                    Powered by Linebridge™

                    <div className="value">
                        <antd.Tag>v{serverManifest?.LINEBRIDGE_SERVER_VERSION ?? "Unknown"}</antd.Tag>
                    </div>
                </div>

                <div className="field">
                    Server origin

                    <div className="value">
                        <antd.Tag>{serverOrigin ?? "Unknown"}</antd.Tag>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    }
}