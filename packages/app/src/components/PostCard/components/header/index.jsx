import React from "react"
import { DateTime } from "luxon"
import { Tag } from "antd"

import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"
import { Icons } from "@components/Icons"

import PostReplieView from "@components/PostReplieView"

import "./index.less"

const PostCardHeader = (props) => {
    const goToProfile = () => {
        app.navigation.goToAccount(props.postData.user?.username)
    }

    return <div className="post-header" onDoubleClick={props.onDoubleClick}>
        {
            !props.disableReplyTag && props.postData.reply_to && <div
                className="post-header-replied_to"
            >
                <div className="post-header-replied_to-label">
                    <Icons.Repeat />

                    <span>
                        Replied to
                    </span>
                </div>

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
                        props.postData.user?.public_name ?? `@${props.postData.user?.username}`
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
                    <TimeAgo
                        time={props.postData.timestamp ?? props.postData.created_at}
                    />
                </span>
            </div>
        </div>
    </div>
}

export default PostCardHeader