import React from "react"
import moment from "moment"
import classnames from "classnames"

import { Image } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [timeAgo, setTimeAgo] = React.useState(0)

    const goToProfile = () => {
        window.app.goToAccount(props.postData.user?.username)
    }

    const updateTimeAgo = () => {
        setTimeAgo(moment(props.postData.created_at ?? "").fromNow())
    }

    React.useEffect(() => {
        updateTimeAgo()

        const interval = setInterval(() => {
            updateTimeAgo()
        }, 10000)

        return () => {
            clearInterval(interval)
        }
    }, [props.postData.created_at])

    return <div className="post_header" onDoubleClick={props.onDoubleClick}>
        <div className="user">
            <div className="avatar">
                <Image
                    alt="Avatar"
                    src={props.postData.user?.avatar}
                />
            </div>
            <div className="info">
                <div>
                    <h1 onClick={goToProfile}>
                        {props.postData.user?.fullName ?? `@${props.postData.user?.username}`}
                        {props.postData.user?.verified && <Icons.verifiedBadge />}
                    </h1>
                </div>

                <div>
                    {timeAgo}
                </div>
            </div>
        </div>
        <div className="statistics">
            <div className="item">
                <Icons.Heart className={classnames("icon", { ["filled"]: props.isLiked })} />
                <div className="value">
                    {props.likes}
                </div>
            </div>
            <div className="item">
                <Icons.MessageSquare />
                <div className="value">
                    {props.comments}
                </div>
            </div>
        </div>
    </div>
}