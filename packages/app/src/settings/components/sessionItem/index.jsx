import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import moment from "moment"
import UAParser from "ua-parser-js"

import { Icons } from "@components/Icons"

import SessionModel from "@models/session"

import ChromeIcon from "./icons/chrome"
import MobileIcon from "./icons/mobile"
import FirefoxIcon from "./icons/firefox"

import "./index.less"

const DeviceIcon = (props) => {
    if (!props.ua) {
        return null
    }

    if (props.ua.ua === "capacitor") {
        return <MobileIcon />
    }

    switch (props.ua.browser.name) {
        case "Chrome": {
            return <ChromeIcon />
        }
        case "Firefox": {
            return <FirefoxIcon />
        }
        default: {
            return <Icons.FiGlobe />
        }
    }
}

const SessionItem = (props) => {
    const { session } = props

    const [collapsed, setCollapsed] = React.useState(true)

    const onClickCollapse = () => {
        setCollapsed((prev) => {
            return !prev
        })
    }

    const onClickRevoke = () => {
        // if (typeof props.onClickRevoke === "function") {
        //     props.onClickRevoke(session)
        // }
    }

    const isCurrentSession = React.useMemo(() => {
        const currentUUID = SessionModel.session_uuid
        return session.session_uuid === currentUUID
    })

    const ua = React.useMemo(() => {
        return UAParser(session.client)
    })

    return <div
        className={classnames(
            "security_sessions_list_item_wrapper",
            {
                ["collapsed"]: collapsed
            }
        )}
    >
        <div
            id={session._id}
            key={props.key}
            className="security_sessions_list_item"
            onClick={onClickCollapse}
        >
            <div className="security_sessions_list_item_icon">
                <DeviceIcon
                    ua={ua}
                />
            </div>

            <antd.Badge dot={isCurrentSession}>
                <div className="security_sessions_list_item_info">
                    <div className="security_sessions_list_item_title">
                        <h3><Icons.FiTag /> {session.session_uuid}</h3>
                    </div>

                    <div className="security_sessions_list_item_info_details">
                        <div className="security_sessions_list_item_info_details_item">
                            <Icons.FiClock />

                            <span>
                                {moment(session.date).format("DD/MM/YYYY HH:mm")}
                            </span>
                        </div>
                        <div className="security_sessions_list_item_info_details_item">
                            <Icons.IoMdLocate />

                            <span>
                                {session.ip_address}
                            </span>
                        </div>
                    </div>
                </div>
            </antd.Badge>
        </div>

        <div className="security_sessions_list_item_extra-body">
            <div className="security_sessions_list_item_actions">
                <antd.Button
                    onClick={onClickRevoke}
                    danger
                    size="small"
                >
                    Revoke
                </antd.Button>
            </div>

            <div className="security_sessions_list_item_info_details_item">
                <Icons.MdDns />

                <span>
                    {session.location}
                </span>
            </div>

            {
                ua.device.vendor && <div className="security_sessions_list_item_info_details_item">
                    <Icons.FiCpu />

                    <span>
                        {ua.device.vendor} | {ua.device.model}
                    </span>
                </div>
            }
        </div>
    </div>
}

export default SessionItem