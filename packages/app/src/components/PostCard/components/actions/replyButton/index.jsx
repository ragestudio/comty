import React from "react"
import { Button } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
    return <div
        className="reply_button"
    >
        <Button
            type="ghost"
            shape="circle"
            onClick={props.onClick}
            icon={<Icons.Repeat />}
        />
        {
            props.count > 0 && <span className="replies_count">{props.count}</span>
        }
    </div>
}