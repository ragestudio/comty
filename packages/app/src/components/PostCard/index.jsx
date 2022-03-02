import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import moment from "moment"

import "./index.less"

function PostHeader({ postData }) {
    const [timeAgo, setTimeAgo] = React.useState(0)

    const updateTimeAgo = () => {
        setTimeAgo(moment(postData.created_at ?? "").fromNow())
    }

    React.useEffect(() => {
        updateTimeAgo()

        const interval = setInterval(() => {
            updateTimeAgo()
        }, 10000)

        return () => {
            clearInterval(interval)
        }
    }, [postData.created_at])

    return <div className="userInfo">
        <div className="avatar">
            <antd.Avatar src={postData.user?.avatar} />
        </div>
        <div className="info">
            <div>
                <h1>
                    {postData.user?.fullName ?? `@${postData.user?.username}`}
                </h1>
            </div>

            <div>
                {timeAgo}
            </div>
        </div>
    </div>
}

function PostContent({ message }) {
    return <div className="content">
        {message}
    </div>
}

function PostActions(props) {
    return <div className="actions">
        <div className="action" id="likes" onClick={props.onClickLike}>
            <div className="icon">
                <Icons.Heart />
            </div>
            <div className="value">
                {String(props.likes)}
            </div>
        </div>
        <div className="action" id="comments" onClick={props.onClickComments}>
            <div className="icon">
                <Icons.MessageSquare className="icon" />
            </div>
            <div className="value">
                {String(props.comments)}
            </div>
        </div>
        <div className="action" id="share" onClick={props.onClickShare}>
            <div className="icon">
                <Icons.Share />
            </div>
        </div>
        {props.isSelf && <div className="action" id="selfMenu" onClick={props.onClickSelfMenu}>
            <div className="icon">
                <Icons.MoreHorizontal />
            </div>
        </div>}
    </div>
}

export default class PostCard extends React.Component {
    render() {
        return <div className="postCard">
            <div className="wrapper">
                <PostHeader
                    postData={this.props.data}
                />
                <PostContent
                    message={this.props.data.message}
                />
            </div>
            <div className="actionsWrapper">
                <PostActions
                    likes={this.props.data.likes.length}
                    comments={this.props.data.comments.length}
                />
            </div>
        </div>
    }
}