import React from "react"
import Account from "./index.mobile"

export default (props) => {
    const username = props.params.username

    return <Account username={username} />
}