import React from "react"
import classnames from "classnames"
import ReactPlayer from "react-player/lazy"
import { motion } from "motion/react"

import Poll from "@components/Poll"
import { Icons } from "@components/Icons"
import { processString } from "@utils"

import PostHeader from "./components/header"
import PostActions from "./components/actions"
import PostAttachments from "./components/attachments"

import "./index.less"

const articleAnimationProps = {
	layout: true,
	initial: { y: -100, opacity: 0 },
	animate: { y: 0, opacity: 1 },
	exit: { scale: 0, opacity: 0 },
	transition: { duration: 0.1 },
}

const messageRegexs = [
	{
		regex: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*/g,
		fn: (key, result) => {
			return (
				<ReactPlayer
					url={result[1]}
					controls
				/>
			)
		},
	},
	{
		regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
		fn: (key, result) => {
			return (
				<a
					key={key}
					href={result[1]}
					target="_blank"
					rel="noopener noreferrer"
				>
					{result[1]}
				</a>
			)
		},
	},
	{
		regex: /(@[a-zA-Z0-9_]+)/gi,
		fn: (key, result) => {
			return (
				<a
					key={key}
					onClick={() =>
						window.app.location.push(`/@${result[1].substr(1)}`)
					}
				>
					{result[1]}
				</a>
			)
		},
	},
	{
		regex: /#[a-zA-Z0-9_]+/gi,
		fn: (key, result) => {
			return (
				<a
					key={key}
					onClick={() =>
						window.app.location.push(
							`/trending/${result[0].substr(1)}`,
						)
					}
				>
					{result[0]}
				</a>
			)
		},
	},
]

export default class PostCard extends React.PureComponent {
	state = {
		data: this.props.data,

		countLikes: this.props.data.countLikes ?? 0,
		countReplies: this.props.data.countComments ?? 0,

		hasLiked: this.props.data.isLiked ?? false,
		hasSaved: this.props.data.isSaved ?? false,
		hasReplies: this.props.data.hasReplies ?? false,

		open: this.props.defaultOpened ?? false,

		isNsfw: this.props.data.flags?.includes("nsfw") ?? false,
		nsfwAccepted: false,
	}

	handleDataUpdate = (data) => {
		this.setState({
			data: data,
		})
	}

	onDoubleClick = async () => {
		if (typeof this.props.events.onDoubleClick !== "function") {
			console.warn("onDoubleClick event is not a function")
			return
		}

		return await this.props.events.onDoubleClick(this.state.data)
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

		const actionResult = await this.props.events.onClickLike(
			this.state.data,
		)

		if (actionResult) {
			this.setState({
				hasLiked: actionResult.liked,
				countLikes: actionResult.count,
			})
		}

		return actionResult
	}

	onClickSave = async () => {
		if (typeof this.props.events.onClickSave !== "function") {
			console.warn("onClickSave event is not a function")
			return
		}

		const actionResult = await this.props.events.onClickSave(
			this.state.data,
		)

		if (actionResult) {
			this.setState({
				hasSaved: actionResult.saved,
			})
		}

		return actionResult
	}

	onClickEdit = async () => {
		if (typeof this.props.events.onClickEdit !== "function") {
			console.warn("onClickEdit event is not a function")
			return
		}

		return await this.props.events.onClickEdit(this.state.data)
	}

	onClickReply = async () => {
		if (typeof this.props.events.onClickReply !== "function") {
			console.warn("onClickReply event is not a function")
			return
		}

		return await this.props.events.onClickReply(this.state.data)
	}

	componentDidUpdate = (prevProps) => {
		if (prevProps.data !== this.props.data) {
			this.setState({
				data: this.props.data,
			})
		}
	}

	componentDidCatch = (error, info) => {
		console.error(error)

		return (
			<div className="postCard error">
				<h1>
					<Icons.TriangleAlert />
					<span>Cannot render this post</span>
					<span>
						Maybe this version of the app is outdated or is not
						supported yet
					</span>
				</h1>
			</div>
		)
	}

	render() {
		return (
			<motion.article
				className={classnames("post_card", {
					["open"]: this.state.open,
				})}
				id={this.state.data._id}
				style={this.props.style}
				{...articleAnimationProps}
			>
				<div
					className="post_card_content"
					context-menu={"post-card"}
					user-id={this.state.data.user_id}
				>
					<PostHeader
						postData={this.state.data}
						onDoubleClick={this.onDoubleClick}
						disableReplyTag={this.props.disableReplyTag}
					/>

					<div
						id="post_content"
						className={classnames("post_content")}
					>
						<div className="message">
							{processString(messageRegexs)(
								this.state.data.message ?? "",
							)}
						</div>

						{!this.props.disableAttachments &&
							this.state.data.attachments &&
							this.state.data.attachments.length > 0 && (
								<PostAttachments
									attachments={this.state.data.attachments}
									flags={this.state.data.flags}
								/>
							)}

						{this.state.data.poll_options && (
							<Poll
								post_id={this.state.data._id}
								options={this.state.data.poll_options}
							/>
						)}
					</div>

					<PostActions
						post={this.state.data}
						user_id={this.state.data.user_id}
						likesCount={this.state.countLikes}
						repliesCount={this.state.countReplies}
						defaultLiked={this.state.hasLiked}
						defaultSaved={this.state.hasSaved}
						PP
						actions={{
							onClickLike: this.onClickLike,
							onClickEdit: this.onClickEdit,
							onClickDelete: this.onClickDelete,
							onClickSave: this.onClickSave,
							onClickReply: this.onClickReply,
						}}
					/>

					{!this.props.disableHasReplies &&
						!!this.state.hasReplies && (
							<div
								className="post-card-has_replies"
								onClick={() =>
									app.navigation.goToPost(this.state.data._id)
								}
							>
								<span>
									View {this.state.hasReplies} replies
								</span>
							</div>
						)}
				</div>
			</motion.article>
		)
	}
}
