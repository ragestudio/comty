import React from "react"
import { Button } from "antd"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    return <div
        className="comments_button"
    >
        <Button
            type="ghost"
            shape="circle"
            onClick={props.onClickComments}
            icon={<Icons.MessageCircle />}
        />
        {
            props.count > 0 && <span className="comments_count">{props.count}</span>
        }
    </div>
}