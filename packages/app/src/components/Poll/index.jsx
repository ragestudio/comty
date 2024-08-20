import React from "react"
import * as antd from "antd"
import classNames from "classnames"

import { createIconRender } from "@components/Icons"

import "./index.less"

const PollOption = (props) => {
    const { option, editMode, onRemove } = props

    return <div
        className={classNames(
            "poll-option",
            {
                ["editable"]: !!editMode
            }
        )}
    >
        {
            editMode && <antd.Input
                placeholder="Option"
                defaultValue={option.label}
            />
        }

        {
            !editMode && <span>
                {option.label}
            </span>
        }

        {
            editMode && <antd.Button
                onClick={onRemove}
                icon={createIconRender("CloseOutlined")}
                size="small"
                type="text"
            />
        }
    </div>
}

const Poll = (props) => {
    const { editMode, onClose } = props

    const [options, setOptions] = React.useState(props.options ?? [])

    async function addOption() {
        setOptions((prev) => {
            return [
                ...prev,
                {
                    label: null
                }
            ]
        })
    }

    async function removeOption(index) {
        setOptions((prev) => {
            return [
                ...prev.slice(0, index),
                ...prev.slice(index + 1)
            ]
        })
    }

    return <div className="poll">
        {
            options.map((option, index) => {
                return <PollOption
                    key={index}
                    option={option}
                    editMode={editMode}
                    onRemove={() => {
                        removeOption(index)
                    }}
                />
            })
        }

        {
            editMode && <div className="poll-edit-actions">
                <antd.Button
                    onClick={addOption}
                    icon={createIconRender("PlusOutlined")}
                >
                    Add Option
                </antd.Button>

                <antd.Button
                    onClick={onClose}
                    icon={createIconRender("CloseOutlined")}
                    size="small"
                    type="text"
                />
            </div>
        }
    </div>
}

export default Poll