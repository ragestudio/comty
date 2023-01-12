import React from "react"
import Account from "."

export default (props) => {
    const username = props.params.username

    return <Account username={username} />
}