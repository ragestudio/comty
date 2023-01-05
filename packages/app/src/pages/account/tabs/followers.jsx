import React from "react"

import { FollowersList } from "components"

export default React.memo((props) => {
    return <FollowersList
        user_id={props.state.user._id}
    />
})