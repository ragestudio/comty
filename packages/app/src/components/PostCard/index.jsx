import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import Plyr from "plyr-react"

import { CommentsCard } from "components"
import { Icons } from "components/Icons"

import { processString } from "utils"

import PostHeader from "./components/header"
import PostActions from "./components/actions"
import PostAttachments from "./components/attachments"

import "./index.less"

const messageRegexs = [
    {
        regex: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*/g,
        fn: (key, result) => {
            return <Plyr source={{
                type: "video",
                sources: [{
                    src: result[1],
                    provider: "youtube",
                }],
            }} />
        }
    },
    {
        regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
        fn: (key, result) => {
            return <a key={key} href={result[1]} target="_blank" rel="noopener noreferrer">{result[1]}</a>
        }
    },
    {
        regex: /(@[a-zA-Z0-9_]+)/gi,
        fn: (key, result) => {
            return <a key={key} onClick={() => window.app.location.push(`/@${result[1].substr(1)}`)}>{result[1]}</a>
        }
    },
]

export default class PostCard extends React.PureComponent {
    state = {
        countLikes: this.props.data.countLikes ?? 0,
        countComments: this.props.data.countComments ?? 0,

        hasLiked: this.props.data.isLiked ?? false,
        hasSaved: this.props.data.isSaved ?? false,

        open: this.props.defaultOpened ?? false,

        isNsfw: this.props.data.flags?.includes("nsfw") ?? false,
        nsfwAccepted: false,
    }

    onClickDelete = async () => {
        if (typeof this.props.events.onClickDelete !== "function") {
            console.warn("onClickDelete event is not a function")
            return
        }

        return await this.props.events.onClickDelete(this.props.data)
    }

    onClickLike = async () => {
        if (typeof this.props.events.onClickLike !== "function") {
            console.warn("onClickLike event is not a function")
            return
        }

        return await this.props.events.onClickLike(this.props.data)
    }

    onClickSave = async () => {
        if (typeof this.props.events.onClickSave !== "function") {
            console.warn("onClickSave event is not a function")
            return
        }

        return await this.props.events.onClickSave(this.props.data)
    }

    onClickEdit = async () => {
        if (typeof this.props.events.onClickEdit !== "function") {
            console.warn("onClickEdit event is not a function")
            return
        }

        return await this.props.events.onClickEdit(this.props.data)
    }

    onDoubleClick = async () => {
        this.handleOpen()
    }

    onClickComments = async () => {
        this.handleOpen()
    }

    handleOpen = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.open
        }

        if (typeof this.props.events?.onToogleOpen === "function") {
            this.props.events?.onToogleOpen(to, this.props.data)
        }

        this.setState({
            open: to,
        })

        //app.controls.openPostViewer(this.props.data)
    }

    onLikesUpdate = (data) => {
        console.log("onLikesUpdate", data)

        if (data.to) {
            this.setState({
                countLikes: this.state.countLikes + 1,
            })
        } else {
            this.setState({
                countLikes: this.state.countLikes - 1,
            })
        }
    }

    componentDidMount = async () => {
        // first listen to post changes
        app.cores.api.listenEvent(`post.${this.props.data._id}.likes.update`, this.onLikesUpdate)
    }

    componentWillUnmount = () => {
        // remove the listener
        app.cores.api.unlistenEvent(`post.${this.props.data._id}.likes.update`, this.onLikesUpdate)
    }

    componentDidCatch = (error, info) => {
        console.error(error)

        return <div className="postCard error">
            <h1>
                <Icons.AlertTriangle />
                <span>Cannot render this post</span>
                <span>
                    Maybe this version of the app is outdated or is not supported yet
                </span>
            </h1>
        </div>
    }

    render() {
        return <div
            key={this.props.index}
            id={this.props.data._id}
            className={classnames(
                "postCard",
                {
                    ["open"]: this.state.open,
                }
            )}
            style={this.props.style}
            context-menu={"postCard-context"}
            user-id={this.props.data.user_id}
        >
            <PostHeader
                postData={this.props.data}
                onDoubleClick={this.onDoubleClick}
            />

            <div
                id="post_content"
                className={classnames(
                    "post_content",
                    {
                        ["nsfw"]: this.state.isNsfw && !this.state.nsfwAccepted,
                    }
                )}
            >
                {
                    this.state.isNsfw && !this.state.nsfwAccepted &&
                    <div className="nsfw_alert">
                        <h2>
                            This post may contain sensitive content.
                        </h2>

                        <antd.Button onClick={() => this.setState({ nsfwAccepted: true })}>
                            Show anyways
                        </antd.Button>
                    </div>
                }

                <div className="message">
                    {
                        processString(messageRegexs)(this.props.data.message ?? "")
                    }
                </div>

                {
                    this.props.data.attachments && this.props.data.attachments.length > 0 && <PostAttachments
                        attachments={this.props.data.attachments}
                    />
                }

            </div>

            <PostActions
                user_id={this.props.data.user_id}
                likesCount={this.state.countLikes}
                commentsCount={this.state.countComments}
                defaultLiked={this.state.hasLiked}
                defaultSaved={this.state.hasSaved}
                actions={{
                    onClickLike: this.onClickLike,
                    onClickEdit: this.onClickEdit,
                    onClickDelete: this.onClickDelete,
                    onClickSave: this.onClickSave,
                    onClickComments: this.onClickComments,
                }}
            />

            <CommentsCard
                post_id={this.props.data._id}
                visible={this.state.open}
            />
        </div>
    }
}