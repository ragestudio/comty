import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { LikeButton } from "components"
import moment from "moment"
import classnames from "classnames"

import { User } from "models"

import "./index.less"

function PostHeader(props) {
    const [timeAgo, setTimeAgo] = React.useState(0)

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

    return <div className="postHeader">
        <div className="userInfo">
            <div className="avatar">
                <antd.Avatar src={props.postData.user?.avatar} />
            </div>
            <div className="info">
                <div>
                    <h1>
                        {props.postData.user?.fullName ?? `@${props.postData.user?.username}`}
                    </h1>
                </div>

                <div>
                    {timeAgo}
                </div>
            </div>
        </div>
        <div className="postStadistics">
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
        </div>
        <div className="action" id="comments" onClick={props.onClickComments}>
            <div className="icon">
                <Icons.MessageSquare className="icon" />
            </div>
        </div>
        <div className="action" id="save" onClick={props.onClickSave}>
            <div className="icon">
                <Icons.Bookmark />
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

    onClickSave = async () => {
        // TODO: save post
    }

    hasLiked = () => {
        return this.state.data.likes.some(user_id => user_id === this.state.selfId)
    }

    isSelf = () => {
        return this.state.selfId === this.state.data.user._id
    }

    render() {
        const hasLiked = this.hasLiked()

        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        return <div
            id={this.props.data._id}
            key={this.props.data._id}
            className={classnames("postCard", { ["liked"]: hasLiked })}
        >
            <div className="wrapper">
                <PostHeader
                    postData={this.props.data}
                    isLiked={hasLiked}
                    onClickLike={() => this.onClickLike(false)}
                    onClickSave={this.onClickSave}
                    likes={this.state.data.likes.length}
                    comments={this.state.data.comments.length}
                />
                <PostContent
                    message={this.props.data.message}
                />
            </div>
            <div className="actionsIndicatorWrapper">
                <div className="actionsIndicator">
                    <Icons.MoreHorizontal />
                </div>
            </div>
            <div className="actionsWrapper">
                <PostActions
                    onClickLike={this.onClickLike}
                    defaultLiked={hasLiked}
                    isSelf={this.isSelf()}
                />
            </div>
        </div>
    }
}