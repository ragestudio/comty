import React from "react"
import { Skeleton } from "antd"
import { LoadingOutlined } from "@ant-design/icons"

import "./index.less"

export default () => {
    return <div className="skeleton">
        <div className="indicator">
            <LoadingOutlined spin />
            <h3>Loading...</h3>
        </div>
        <Skeleton active />
    </div>
}