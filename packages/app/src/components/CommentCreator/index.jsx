import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [value, setValue] = React.useState(null)
    const [loading, setLoading] = React.useState(false)

    const submit = async () => {
        if (!canSubmit()) return

        if (typeof props.onSubmit !== "function") {
            console.warn("No `onSubmit` handler provided")
            return
        }

        setLoading(true)

        try {
            await props.onSubmit(value)
        } catch (error) {

        }

        setLoading(false)
        setValue(null)
    }

    const handleChange = (e) => {
        if (e.target.value === "") {
            return setValue(null)
        }

        return setValue(String(e.target.value))
    }

    const handleKeyDown = (e) => {
        // detect if the user pressed `enter` key and submit the form, but only if the `shift` key is not pressed
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()

            submit()
        }
    }

    const canSubmit = () => {
        if (loading) return false

        if (value === null) return false

        if (value === "") return false

        return true
    }

    return <div className="commentCreator">
        <antd.Input.TextArea
            placeholder="Write a comment..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={props.maxLength}
            draggable={false}
            disabled={loading}
            value={value}
        />
        <antd.Button
            type="primary"
            disabled={loading || !canSubmit()}
            icon={loading ? <Icons.LoadingOutlined spin /> : <Icons.Send />}
            onClick={submit}
        />
    </div>
}