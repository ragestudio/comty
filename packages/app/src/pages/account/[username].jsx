import React from "react"
import Account from "."

export default (props) => {
    const username = props.match.params.username

    return <Account username={username} />
}