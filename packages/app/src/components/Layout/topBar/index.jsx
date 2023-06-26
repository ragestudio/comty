import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import "./index.less"

const useLayoutInterface = (namespace, ctx) => {
    React.useEffect(() => {
        if (app.layout["namespace"] === "object") {
            throw new Error(`Layout namespace [${namespace}] already exists`)
        }

        app.layout[namespace] = ctx
    }, [])

    return app.layout[namespace]
}

const useDefaultVisibility = (defaultValue) => {
    const [visible, setVisible] = React.useState(defaultValue ?? false)

    React.useEffect(() => {
        setTimeout(() => {
            setVisible(true)
        }, 10)
    }, [])

    return [visible, setVisible]
}

export const UseTopBar = (props) => {
    app.layout.top_bar.render(
        <React.Fragment>
            {props.children}
        </React.Fragment>,
        props.options)

    React.useEffect(() => {
        return () => {
            app.layout.top_bar.renderDefault()
        }
    }, [])

    return null
}

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
            app.layout.toogleTopBarSpacer(to)
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
            app.layout.tooglePagePanelSpacer(true)
        } else {
            app.layout.tooglePagePanelSpacer(false)
        }
    }, [shouldUseTopBarSpacer])

    React.useEffect(() => {
        if (shouldUseTopBarSpacer) {
            if (visible) {
                app.layout.toogleTopBarSpacer(true)
            } else {
                app.layout.toogleTopBarSpacer(false)
            }
        } else {
            if (visible) {
                app.layout.tooglePagePanelSpacer(true)
            } else {
                app.layout.tooglePagePanelSpacer(false)
            }

            app.layout.toogleTopBarSpacer(false)
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

    console.log(render)

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