import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import DOMPurify from "dompurify"
import axios from "axios"

import { createIconRender } from "@components/Icons"
import { UserModel } from "@models"

import "./index.less"

const RemoteSVG = (props) => {
    // IMPORTANT: Only use this component for SVG files that you trust.
    console.warn("RemoteSVGToComponent: This component is not safe at all, cause use __dangerouslySetInnerHTML. Only use it for SVG files that you trust.")

    // make sure the url is local
    if (!props.src.startsWith("/") && !props.remote) {
        console.error("RemoteSVGToComponent: The file is not a local file.")
        return () => null
    }

    // make sure the file is a SVG
    if (!props.src.endsWith(".svg")) {
        console.error("RemoteSVGToComponent: The file is not a SVG.")
        return () => null
    }

    const [L_Badge, R_Badge, E_Badge] = app.cores.api.useRequest(async () => {
        return await axios({
            method: "GET",
            url: props.src,
        })
    })

    if (E_Badge || L_Badge) {
        return <></>
    }

    return <div dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(R_Badge.data, {
            USE_PROFILES: {
                svg: true
            }
        })
    }} />
}

export default (props) => {
    let { user_id } = props

    const [L_Badges, R_Badges, E_Badges] = app.cores.api.useRequest(UserModel.getBadges, user_id)

    if (E_Badges) {
        return null
    }

    if (L_Badges) {
        return null
    }

    if (!R_Badges) {
        return null
    }

    return <div
        className={classnames(
            "badges",
            {
                ["single"]: R_Badges.length === 1
            }
        )}
    >
        {
            R_Badges.map((badge, index) => {
                return <antd.Tooltip
                    key={index}
                    placement="bottom"
                    title={badge.description ?? "A badge"}
                >
                    <div
                        key={index}
                        className="badge"
                        style={{
                            "--icon-color": badge.color ?? "var(--colorPrimary)"
                        }}
                    >
                        {
                            badge.iconUrl
                                ? <RemoteSVG
                                    src={badge.iconUrl}
                                />
                                : createIconRender(badge.icon)
                        }
                    </div>
                </antd.Tooltip>
            })
        }
    </div>
}