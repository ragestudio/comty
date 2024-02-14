import React from "react"
import * as antd from "antd"

import "./index.less"

const HTTPMenuItems = [
    {
        key: "custom",
        label: "Custom Request",
    },
    {
        key: "get",
        label: "GET",
        children: [
            {
                key: "get:/",
                label: "/",
            }
        ]
    }
]

const HTTPDebug = (props) => {
    const apiInstance = app.cores.api.instance()

    React.useEffect(() => {
        props.updateDimensions({
            width: 600,
            height: 500,
        })
    }, [])

    return <div className="http_debug">
        <div className="http_debug_menu">
            <antd.Menu
                items={HTTPMenuItems}
                mode="inline"
            />

            <div className="http_debug_menu_info">
            <p>
                {apiInstance.mainOrigin}
            </p>
            <p>
                v{apiInstance.version}
            </p>
            </div>
        </div>

        <div className="http_debug_content">
            <div className="http_debug_content_inner">
                Content
            </div>
        </div>
    </div>
}

export default HTTPDebug