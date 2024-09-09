import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { MdSave, MdEdit, MdClose } from "react-icons/md"

import "./index.less"

const EditableText = (props) => {
    const [loading, setLoading] = React.useState(false)
    const [isEditing, setEditing] = React.useState(false)
    const [value, setValue] = React.useState(props.value)

    async function handleSave(newValue) {
        setLoading(true)

        if (typeof props.onSave === "function") {
            await props.onSave(newValue)

            setEditing(false)
            setLoading(false)
        } else {
            setValue(newValue)
            setLoading(false)
        }
    }

    function handleCancel() {
        setValue(props.value)
        setEditing(false)
    }

    React.useEffect(() => {
        setValue(props.value)
    }, [props.value])

    return <div
        style={props.style}
        className={classnames("editable-text", props.className)}
    >
        {
            !isEditing && <span
                onClick={() => setEditing(true)}
                className="editable-text-value"
            >
                <MdEdit />

                {value}
            </span>
        }
        {
            isEditing && <div className="editable-text-input-container">
                <antd.Input
                    className="editable-text-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    loading={loading}
                    disabled={loading}
                    onPressEnter={() => handleSave(value)}
                />
                <antd.Button
                    type="primary"
                    onClick={() => handleSave(value)}
                    icon={<MdSave />}
                    loading={loading}
                    disabled={loading}
                    size="small"
                />
                <antd.Button
                    onClick={handleCancel}
                    disabled={loading}
                    icon={<MdClose />}
                    size="small"
                />
            </div>
        }
    </div>
}

export default EditableText