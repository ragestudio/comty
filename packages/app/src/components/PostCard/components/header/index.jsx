import React from "react"
import { DateTime } from "luxon"

import { Image } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [timeAgo, setTimeAgo] = React.useState(0)

    const goToProfile = () => {
        app.navigation.goToAccount(props.postData.user?.username)
    }

    const updateTimeAgo = () => {
        let createdAt = props.postData.timestamp ?? props.postData.created_at ?? ""

        const timeAgo = DateTime.fromISO(createdAt, { locale: app.cores.settings.get("language") }).toRelative()

        setTimeAgo(timeAgo)
    }

    React.useEffect(() => {
        updateTimeAgo()

        const interval = setInterval(() => {
            updateTimeAgo()
        }, 1000 * 60 * 5)

        return () => {
            clearInterval(interval)
        }
    }, [])

    return <div className="post_header" onDoubleClick={props.onDoubleClick}>
        <div className="user">
            <div className="avatar">
                <Image
                    alt="Avatar"
                    src={props.postData.user?.avatar}
                />
            </div>
            <div className="info">
                <h1 onClick={goToProfile}>
                    {props.postData.user?.fullName ?? `@${props.postData.user?.username}`}
                    {props.postData.user?.verified && <Icons.verifiedBadge />}
                </h1>

                <span className="timeago">
                    {timeAgo}
                </span>
            </div>
        </div>
    </div>
}