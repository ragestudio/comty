import React from "react"
import { DateTime } from "luxon"
import { Tag, Skeleton } from "antd"

import { Image } from "components"
import { Icons } from "components/Icons"
import PostLink from "components/PostLink"

import PostService from "models/post"

import "./index.less"

const PostReplieView = (props) => {
    const { data } = props

    if (!data) {
        return null
    }

    return <div>
        @{data.user.username}
        {data.message}
    </div>
}

const PostCardHeader = (props) => {
    const [timeAgo, setTimeAgo] = React.useState(0)

    const goToProfile = () => {
        app.navigation.goToAccount(props.postData.user?.username)
    }

    const updateTimeAgo = () => {
        let createdAt = props.postData.timestamp ?? props.postData.created_at ?? ""

        const timeAgo = DateTime.fromISO(
            createdAt,
            {
                locale: app.cores.settings.get("language")
            }
        ).toRelative()

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

    return <div className="post-header" onDoubleClick={props.onDoubleClick}>
        {
            !props.disableReplyTag && props.postData.reply_to && <div
                className="post-header-replied_to"
            >
                <Icons.Repeat />

                <span>
                    Replied to
                </span>

                <PostReplieView
                    data={props.postData.reply_to_data}
                />
            </div>
        }

        <div className="post-header-user">
            <div className="post-header-user-avatar">
                <Image
                    alt="Avatar"
                    src={props.postData.user?.avatar}
                />
            </div>

            <div className="post-header-user-info">
                <h1 onClick={goToProfile}>
                    {
                        props.postData.user?.public_name ?? `${props.postData.user?.username}`
                    }

                    {
                        props.postData.user?.verified && <Icons.verifiedBadge />
                    }

                    {
                        props.postData.flags?.includes("nsfw") && <Tag
                            color="volcano"
                        >
                            NSFW
                        </Tag>
                    }
                </h1>

                <span className="post-header-user-info-timeago">
                    {timeAgo}
                </span>
            </div>
        </div>
    </div>
}

export default PostCardHeader