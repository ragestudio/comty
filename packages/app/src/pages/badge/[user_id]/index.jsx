import React from "react"

const BadgePage = (props) => {
    const user_id = props.params.user_id

    return <div>
        Badge Page
        {user_id}
    </div>
}

export default BadgePage