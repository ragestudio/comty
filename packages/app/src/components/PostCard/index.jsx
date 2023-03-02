import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { CommentsCard } from "components"
import { Icons } from "components/Icons"

import PostHeader from "./components/header"
import PostContent from "./components/content"
import PostActions from "./components/actions"
import PostAttachments from "./components/attachments"

import "./index.less"

export default class PostCard extends React.PureComponent {
    state = {
        loading: true,
        data: this.props.data ?? {},

        countLikes: this.props.data.countLikes ?? 0,
        countComments: this.props.data.countComments ?? 0,

        hasLiked: this.props.data.isLiked ?? false,
        hasSaved: this.props.data.isSaved ?? false,

        open: this.props.defaultOpened ?? false,
    }

    onClickDelete = async () => {
        if (typeof this.props.events.onClickDelete !== "function") {
            console.warn("onClickDelete event is not a function")
            return
        }

        return await this.props.events.onClickDelete(this.state.data)
    }

    onClickLike = async () => {
        if (typeof this.props.events.onClickLike !== "function") {
            console.warn("onClickLike event is not a function")
            return
        }

        return await this.props.events.onClickLike(this.state.data)
    }

    onClickSave = async () => {
        if (typeof this.props.events.onClickSave !== "function") {
            console.warn("onClickSave event is not a function")
            return
        }

        return await this.props.events.onClickSave(this.state.data)
    }

    onClickEdit = async () => {
        if (typeof this.props.events.onClickEdit !== "function") {
            console.warn("onClickEdit event is not a function")
            return
        }

        return await this.props.events.onClickEdit(this.state.data)
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
            this.props.events?.onToogleOpen(to, this.state.data)
        }

        this.setState({
            open: to,
        })

        //app.controls.openPostViewer(this.state.data)
    }

    onLikesUpdate = (data) => {
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
        app.eventBus.on(`post.${this.state.data._id}.delete`, this.onClickDelete)
        app.eventBus.on(`post.${this.state.data._id}.update`, this.onClickEdit)

        // first listen to post changes
        app.cores.api.listenEvent(`post.${this.state.data._id}.likes.update`, this.onLikesUpdate)

        this.setState({
            isSelf: app.cores.permissions.checkUserIdIsSelf(this.state.data.user_id),
            loading: false,
        })
    }

    componentWillUnmount = () => {
        app.eventBus.off(`post.${this.state.data._id}.delete`, this.onClickDelete)
        app.eventBus.off(`post.${this.state.data._id}.update`, this.onClickEdit)

        // remove the listener
        app.cores.api.unlistenEvent(`post.${this.state.data._id}.likes.update`, this.onLikesUpdate)
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

    render = () => {
        if (this.state.loading) {
            return <div
                key={this.state.data.key ?? this.state.data._id}
                id={this.state.data._id}
                className="postCard"
            >
                <antd.Skeleton active avatar />
            </div>
        }

        return <div
            key={this.props.index ?? this.state.data._id}
            id={this.state.data._id}
            className={classnames(
                "postCard",
                {
                    ["open"]: this.state.open,
                }
            )}
            context-menu={"postCard-context"}
            user-id={this.state.data.user_id}
            self-post={this.state.isSelf.toString()}
        >
            <div className="wrapper">
                <PostHeader
                    postData={this.state.data}
                    isLiked={this.state.hasLiked}
                    onDoubleClick={this.onDoubleClick}
                />
                <PostContent
                    data={this.state.data}
                    nsfw={this.state.data.flags && this.state.data.flags.includes("nsfw")}
                    onDoubleClick={this.onDoubleClick}
                >
                    {this.state.data.attachments && this.state.data.attachments.length > 0 && <PostAttachments
                        attachments={this.state.data.attachments}
                    />}
                </PostContent>
            </div>
            <PostActions
                likesCount={this.state.countLikes}
                commentsCount={this.state.countComments}
                defaultLiked={this.state.hasLiked}
                defaultSaved={this.state.hasSaved}
                onClickLike={this.onClickLike}
                onClickSave={this.onClickSave}
                onClickComments={this.onClickComments}
                actions={{
                    delete: this.onClickDelete,
                }}
            />

            {
                this.state.open && <CommentsCard post_id={this.state.data._id} />
            }
        </div>
    }
}