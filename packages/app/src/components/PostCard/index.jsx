import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import classnames from "classnames"
import moment from "moment"

import { User } from "models"

import "./index.less"

function LikeButton(props) {
    const [liked, setLiked] = React.useState(props.defaultLiked ?? false)

    const handleClick = async () => {
        let to = !liked

        if (typeof props.onClick === "function") {
            const result = await props.onClick(to)
            if (typeof result === "boolean") {
                to = result
            }
        }

        setLiked(to)
    }

    return <button
        className={classnames("likeButton", { ["clicked"]: liked })}
        onClick={handleClick}
    >
        <div
            className={classnames(
                "ripple",
                { ["clicked"]: liked }
            )}
        ></div>
        <svg
            className={classnames(
                "heart",
                { ["empty"]: !liked },
                { ["clicked"]: liked },
            )}
            width="24"
            height="24"
            viewBox="0 0 24 24"
        >
            <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"></path>
        </svg>
    </button>
}

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
        <div className="action" id="likes">
            <div className="icon">
                <LikeButton defaultLiked={props.defaultLiked} onClick={props.onClickLike} />
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
    state = {
        loading: true,
        selfId: null,
        data: this.props.data,
    }

    api = window.app.request

    componentDidMount = async () => {
        const selfId = await User.selfUserId()

        window.app.ws.listen(`like.post.${this.props.data._id}`, async (data) => {
            await this.setState({ data })
        })
        window.app.ws.listen(`unlike.post.${this.props.data._id}`, async (data) => {
            await this.setState({ data })
        })

        await this.setState({
            selfId,
            likes: this.props.data.likes,
            loading: false
        })
    }

    onClickLike = async (to) => {
        let result = false

        if (to) {
            const apiResult = await await this.api.put.like({ post_id: this.props.data._id })
            result = apiResult.success
        } else {
            const apiResult = await await this.api.put.unlike({ post_id: this.props.data._id })
            result = apiResult.success
        }

        return result
    }

    hasLiked = () => {
        return this.props.data.likes.some(user_id => user_id === this.state.selfId)
    }

    render() {
        const defaultLiked = this.hasLiked()

        if (this.state.loading) {
            return <antd.Skeleton active />
        }

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
                    onClickLike={this.onClickLike}
                    defaultLiked={defaultLiked}
                    likes={this.state.data.likes.length}
                    comments={this.state.data.comments.length}
                />
            </div>
        </div>
    }
}