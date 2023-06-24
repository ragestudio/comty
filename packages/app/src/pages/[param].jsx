import React from "react"
import { Result } from "antd"

export default (props) => {
    const entryParam = props.params.param

    if (entryParam.startsWith("@")) {
        const username = entryParam.replace("@", "")

        window.app.location.push(`/account/${username}`, {
            state: {
                "noTransition": true,
            }
        })
    }

    return <Result 
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
    />
}