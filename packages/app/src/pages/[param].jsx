import React from "react"

export default (props) => {
    const entryParam = props.params.param

    if (entryParam.startsWith("@")) {
        const username = entryParam.replace("@", "")

        window.app.setLocation(`/account/${username}`, {
            state: {
                "noTransition": true,
            }
        })
    }

    return <div />
}