import React from "react"
import * as antd from "antd"

import useRequest from "comty.js/hooks/useRequest"
import Streaming from "@models/spectrum"

const ProfileConnection = (props) => {
    const [loading, result, error, repeat] = useRequest(Streaming.getConnectionStatus, {
        profile_id: props.profile_id
    })

    React.useEffect(() => {
        repeat({
            profile_id: props.profile_id
        })
    }, [props.profile_id])

    if (error) {
        return <antd.Tag
            color="error"
        >
            <span>Disconnected</span>
        </antd.Tag>
    }

    if (loading) {
        return <antd.Tag>
            <span>Loading</span>
        </antd.Tag>
    }

    return <antd.Tag
        color="green"
    >
        <span>Connected</span>
    </antd.Tag>
}

export default ProfileConnection