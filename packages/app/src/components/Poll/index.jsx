import React from "react"

import { createIconRender } from "@components/Icon"

import "./index.less"

const PollOption = (props) => {
    return <div className="poll-option">
        <div className="label">
            {
                createIconRender(props.option.icon)
            }

            <span>
                {props.option.label}
            </span>
        </div>
    </div>
}

const Poll = (props) => {
    return <div className="poll">
        {
            props.options.map((option) => {
                return <PollOption
                    key={option.id}
                    option={option}
                />
            })
        }
    </div>
}

export default Poll