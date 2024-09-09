import React from "react"
import * as antd from "antd"

import { IoMdClipboard, IoMdEye, IoMdEyeOff } from "react-icons/io"

const HiddenText = (props) => {
    const [visible, setVisible] = React.useState(false)

    function copyToClipboard() {
        try {
            navigator.clipboard.writeText(props.value)
            antd.message.success("Copied to clipboard")
        } catch (error) {
            console.error(error)
            antd.message.error("Failed to copy to clipboard")
        }
    }

    return <div
        style={{
            width: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            ...props.style
        }}
    >
        <antd.Button
            icon={<IoMdClipboard />}
            type="ghost"
            size="small"
            onClick={copyToClipboard}
        />

        <span>
            {
                visible ? props.value : "********"
            }
        </span>

        <antd.Button
            style={{
                position: "absolute",
                right: 0,
                top: 0
            }}
            icon={visible ? <IoMdEye /> : <IoMdEyeOff />}
            type="ghost"
            size="small"
            onClick={() => setVisible(!visible)}
        />
    </div>
}

export default HiddenText