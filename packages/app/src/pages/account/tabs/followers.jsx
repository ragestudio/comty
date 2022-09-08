import React from "react"

import { FollowersList } from "components"

export default React.memo((props) => {
    return <FollowersList
        followers={props.state.followers}
    />
})