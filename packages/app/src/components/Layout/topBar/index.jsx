import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import useLayoutInterface from "hooks/useLayoutInterface"
import useDefaultVisibility from "hooks/useDefaultVisibility"

import "./index.less"

export default (props) => {
    const [visible, setVisible] = useDefaultVisibility()
    const [shouldUseTopBarSpacer, setShouldUseTopBarSpacer] = React.useState(true)
    const [render, setRender] = React.useState(null)

    useLayoutInterface("top_bar", {
        toggleVisibility: (to) => {
            setVisible((prev) => {
                if (typeof to === undefined) {
                    to = !prev
                }

                return to
            })
        },
        render: (component, options) => {
            handleUpdateRender(component, options)
        },
        renderDefault: () => {
            setRender(null)
        },
        shouldUseTopBarSpacer: (to) => {
            app.layout.toggleTopBarSpacer(to)
            setShouldUseTopBarSpacer(to)
        }
    })

    const handleUpdateRender = (...args) => {
        if (document.startViewTransition) {
            return document.startViewTransition(() => {
                updateRender(...args)
            })
        }

        return updateRender(...args)
    }

    const updateRender = (component, options = {}) => {
        setRender({
            component,
            options
        })
    }

    React.useEffect(() => {
        if (!shouldUseTopBarSpacer) {
            app.layout.togglePagePanelSpacer(true)
        } else {
            app.layout.togglePagePanelSpacer(false)
        }
    }, [shouldUseTopBarSpacer])

    React.useEffect(() => {
        if (shouldUseTopBarSpacer) {
            if (visible) {
                app.layout.toggleTopBarSpacer(true)
            } else {
                app.layout.toggleTopBarSpacer(false)
            }
        } else {
            if (visible) {
                app.layout.togglePagePanelSpacer(true)
            } else {
                app.layout.togglePagePanelSpacer(false)
            }

            app.layout.toggleTopBarSpacer(false)
        }
    }, [visible])

    React.useEffect(() => {
        if (render) {
            setVisible(true)
        } else {
            setVisible(false)
        }
    }, [render])

    const heightValue = visible ? Number(app.cores.style.defaultVar("top-bar-height").replace("px", "")) : 0

    return <Motion style={{
        y: spring(visible ? 0 : 300,),
        height: spring(heightValue,),
    }}>
        {({ y, height }) => {
            return <>
                <div
                    className="top-bar_wrapper"
                    style={{
                        WebkitTransform: `translateY(-${y}px)`,
                        transform: `translateY(-${y}px)`,
                        height: `${height}px`,
                    }}
                >
                    <div
                        className={classnames(
                            "top-bar",
                            render?.options?.className,
                        )}
                    >
                        {
                            render?.component && React.cloneElement(render?.component, render?.options?.props ?? {})
                        }
                    </div>
                </div>
            </>
        }}
    </Motion>
}