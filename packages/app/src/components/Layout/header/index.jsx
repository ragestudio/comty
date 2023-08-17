import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import useLayoutInterface from "hooks/useLayoutInterface"

import "./index.less"

export default (props) => {
    const [render, setRender] = React.useState(null)

    useLayoutInterface("header", {
        render: (component, options) => {
            if (component === null) {
                return setRender(null)
            }

            return setRender({
                component,
                options
            })
        }
    })

    return <Motion
        style={{
            y: spring(render ? 0 : 100,),
        }}
    >
        {({ y, height }) => {
            return <div
                className={classnames(
                    "page_header_wrapper",
                    {
                        ["hidden"]: !render,
                    }
                )}
                style={{
                    WebkitTransform: `translateY(-${y}px)`,
                    transform: `translateY(-${y}px)`,
                }}
            >
                {
                    render?.component && React.cloneElement(
                        render?.component,
                        render?.options?.props ?? {}
                    )
                }
            </div>
        }}
    </Motion>
}
