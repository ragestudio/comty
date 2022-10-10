import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [saved, setSaved] = React.useState(props.defaultActive)

    const onClick = async () => {
        props.onClick({
            to: !saved,
        })
        setSaved(!saved)
    }

    return <antd.Button
        className={classnames("saveButton", {
            ["active"]: saved
        })}
        shape="circle"
        onClick={onClick}
        icon={saved ? <Icons.MdBookmark /> : <Icons.MdBookmarkBorder />}
        size="large"
    />
}