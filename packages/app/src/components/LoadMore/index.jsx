import React from "react"
import classnames from "classnames"

import "./index.less"

export default React.forwardRef((props, ref) => {
    const {
        className,
        children,
        hasMore,
        loadingComponent,
        noResultComponent,
        contentProps = {},
    } = props

    let observer = null

    const insideViewportCb = (entries) => {
        const { fetching, onBottom } = props

        console.log("entries", entries)

        entries.forEach(element => {
            if (element.intersectionRatio > 0 && !fetching) {
                onBottom()
            }
        })
    }

    React.useEffect(() => {
        try {
            const node = document.getElementById("bottom")

            observer = new IntersectionObserver(insideViewportCb)
            observer.observe(node)
        } catch (err) {
            console.log("err in finding node", err)
        }

        return () => {
            observer.disconnect()
            observer = null
        }
    }, [])

    return <div
        ref={ref}
        className={classnames(className)}
        {...contentProps}
    >
        {children}

        <div style={{ clear: "both" }} />

        <div
            id="bottom"
            className="bottom"
            style={{ display: hasMore ? "block" : "none" }}
        >
            {loadingComponent && React.createElement(loadingComponent)}
        </div>

        <div
            className="no-result"
            style={{ display: hasMore ? "none" : "block" }}
        >
            {noResultComponent ? React.createElement(noResultComponent) : "No more result"}
        </div>
    </div>
})