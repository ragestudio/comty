import React from "react"
import * as antd from "antd"
import moment from "moment"

import { Icons } from "components/Icons"

import config from "config"

import "./index.less"

export default (props) => {
    const isProduction = import.meta.env.PROD

    const [serverManifest, setServerManifest] = React.useState(null)

    const checkServerVersion = async () => {
        const serverManifest = await app.cores.api.customRequest("main")

        setServerManifest(serverManifest.data)
    }

    React.useEffect(() => {
        checkServerVersion()
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
                <span>
                    <Icons.Globe /> Origin address
                </span>

                <div className="value">
                    {app.cores.api?.namespaces.main.origin ?? "Unknown"}
                </div>
            </div>
            <div className="field">
                <span>
                    <Icons.Clock /> Server Time
                </span>

                <div className="value">
                    {moment(serverManifest?.requestTime).format("YYYY-MM-DD HH:mm:ss")}
                </div>
            </div>
        </div>
    </div>
}