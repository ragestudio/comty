import React from "react"
import { LoadingOutlined } from "@ant-design/icons"
import { Result } from "antd"

export default (props = {}) => {
    return <div>
       <Result title={props.title ?? "Loading"} icon={<LoadingOutlined spin />} />
    </div>
}