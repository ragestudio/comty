import React from "react"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    const [visible, setVisible] = React.useState(false)

    const headerInterface = {
        toggle: (to) => setVisible((prevValue) => to ?? !prevValue),
    }

    React.useEffect(() => {
        app.layout.header = headerInterface
    }, [])

    return <div
        className={classnames(
            "page_header",
            {
                ["visible"]: visible,
            }
        )}
    >
        {String(window.location.pathname).toTitleCase()}
    </div>
}
