import React from "react"
import classNames from "classnames"
import { Mentions } from "antd"
import { DateTime } from "luxon"

import queuedUploadFile from "@utils/queuedUploadFile"

import PostModel from "@models/post"
//import SearchModel from "@models/search"

import Poll from "@components/Poll"
import PostCreatorActions from "./actions"
import PostCreatorAttachments from "./attachments"

import "./index.less"

const DEFAULT_POST_POLICY = {
	maxMessageLength: 512,
	maxAttachments: 10,
	acceptedMimeTypes: [
		"image/gif",
		"image/png",
		"image/jpeg",
		"image/bmp",
		"video/mp4",
		"video/webm",
		"video/quicktime",
		"audio/mp3",
		"audio/wav",
		"audio/ogg",
		"audio/mpeg",
	],
}

// TODO: Cleanup methods
// TODO: Support for user mentions load
// TODO: Use a context instead of passing props down (no bueno)
const PostCreator = ({ edit_post, reply_to, close, onPost }) => {
	const [loading, setLoading] = React.useState(false)
	const [pendingFiles, setPendingFiles] = React.useState([])
	const [postObj, setPostObj] = React.useState({})

	const [poll, setPoll] = React.useState(null)
	const pollRef = React.useRef(null)

	const updatePostObj = React.useCallback((key, value) => {
		setPostObj((prev) => ({ ...prev, [key]: value }))
	}, [])

	const resetPostObj = React.useCallback(() => {
		setPostObj({})
	}, [])

	const handleMessageInputChange = React.useCallback((text) => {
		// if the first character is a space or a whitespace remove it
		if (text[0] === " " || text[0] === "\n") {
			text = text.slice(1)
		}

		updatePostObj("message", text)
	}, [])

	const handleUploadMedia = React.useCallback(
		async (files) => {
			if (!files) {
				return
			}
			if (!Array.isArray(files)) {
				files = [files]
			}

			if (files.length > DEFAULT_POST_POLICY.maxAttachments) {
				console.error("Too many attachments")
				app.message.error("Too many attachments")
				return
			}

			for (const file of files) {
				if (
					!DEFAULT_POST_POLICY.acceptedMimeTypes.includes(file.type)
				) {
					console.error("Unsupported media type")
					continue
				}

				file.uid = `${file.name}-${new Date().getTime()}`
				file.percent = 0

				setPendingFiles((prev) => [...prev, file])

				queuedUploadFile(file, {
					onFinish: (file, response) => {
						setPostObj((prev) => ({
							...prev,
							attachments: [
								...(prev?.attachments ?? []),
								response,
							],
						}))
					},
					onProgress: (file, progress = {}) => {
						setPendingFiles((prev) => {
							const items = [...prev]

							items.forEach((item) => {
								if (item.uid === file.uid) {
									item.percent = progress.percent
								}
							})

							return items
						})
					},
					onFinally: () => {
						setPendingFiles((prev) =>
							prev.filter((f) => f.uid !== file.uid),
						)
					},
				})
			}
		},
		[postObj],
	)

	const handleDeleteMedia = React.useCallback((attachment) => {
		setPostObj((prev) => ({
			...prev,
			attachments: prev?.attachments?.filter(
				(a) => a.id !== attachment.id,
			),
		}))
	}, [])

	const canPublish = React.useCallback(() => {
		if (!postObj) {
			return false
		}

		if (!postObj.message && !postObj.attachments) {
			return false
		}

		if (pendingFiles.length !== 0) {
			return false
		}

		const messageLengthValid =
			postObj.message?.length > 0 &&
			postObj.message?.length < DEFAULT_POST_POLICY.maxMessageLength

		if (!messageLengthValid && postObj.attachments?.length === 0) {
			return false
		}

		return true
	}, [postObj])

	const handleAddPoll = React.useCallback(() => {
		if (poll) {
			return null
		}

		return setPoll([{ label: "" }, { label: "" }])
	}, [poll])

	const handleDeletePoll = React.useCallback(() => {
		if (!poll) {
			return null
		}

		setPoll(null)
	}, [poll])

	const submit = React.useCallback(async () => {
		if (loading) {
			return null
		}

		if (!canPublish()) {
			return null
		}

		setLoading(true)

		const payload = {
			message: postObj.message,
			attachments: postObj.attachments,
			visibility: postObj.visibility,
			timestamp: DateTime.local().toISO(),
			reply_to: reply_to,
		}

		if (pollRef.current) {
			let { options } = pollRef.current.getFieldsValue()
			payload.poll_options = options.filter((option) => !!option.label)
		}

		let response = null

		if (edit_post) {
			response = await PostModel.update(edit_post, payload).catch(
				(error) => {
					app.message.error(error.message)
					return null
				},
			)
		} else {
			response = await PostModel.create(payload).catch((error) => {
				app.message.error(error.message)
				return null
			})
		}

		setLoading(false)

		if (response) {
			resetPostObj()

			if (typeof close === "function") {
				close()
			}

			if (typeof onPost === "function") {
				onPost()
			}
		}
	}, [postObj])

	const handleKeyDown = React.useCallback(
		async (e) => {
			//console.debug(e)

			// check if is ctrl + v
			if (e.ctrlKey && e.key === "v") {
				// check if is media on the clipboard
				if (navigator.clipboard.read) {
					const clipboardItems = await navigator.clipboard.read()

					if (
						clipboardItems &&
						clipboardItems[0] &&
						DEFAULT_POST_POLICY.acceptedMimeTypes.includes(
							clipboardItems[0].types[0],
						)
					) {
						const blob = await clipboardItems[0].getType(
							clipboardItems[0].types[0],
						)

						handleUploadMedia([
							new File([blob], "media", {
								type: blob.type,
							}),
						])
					}
				}

				return
			}

			if (e.ctrlKey && e.key === "Enter") {
				return submit()
			}
		},
		[postObj],
	)

	// if edit_post is defined, load post data
	React.useEffect(() => {
		if (!edit_post) {
			return edit_post
		}

		setLoading(true)

		PostModel.post({ post_id: edit_post })
			.then((post) => {
				setPostObj(post)

				if (post.poll_options) {
					setPoll(post.poll_options)
				}
			})
			.catch((err) => {
				if (close) {
					close()
				}

				console.error("Failed to load post data", err)
				app.message.error("Failed to load post data")
			})
			.finally(() => {
				setLoading(false)
			})
	}, [edit_post])

	return (
		<div className={classNames("post-creator", "bg-accent")}>
			{reply_to && (
				<div className="flex-row gap-5">
					<span>Replying to:</span>
					<span>{reply_to}</span>
				</div>
			)}

			<Mentions
				placeholder="What are you thinking?"
				value={postObj.message}
				autoSize={{ minRows: 3, maxRows: 6 }}
				maxLength={DEFAULT_POST_POLICY.maxMessageLength}
				onChange={handleMessageInputChange}
				onKeyDown={handleKeyDown}
				disabled={loading}
				draggable={false}
				prefix="@"
				allowClear
				autoFocus
			/>

			{poll && (
				<Poll
					formRef={pollRef}
					options={poll}
					onClose={handleDeletePoll}
					editMode
				/>
			)}

			<PostCreatorAttachments
				pending={pendingFiles}
				attachments={postObj?.attachments ?? []}
				onClickDeleteItem={handleDeleteMedia}
			/>

			<PostCreatorActions
				postObj={postObj}
				updatePostObj={updatePostObj}
				loading={loading}
				onPublish={submit}
				canPublish={canPublish()}
				handleUploadMedia={handleUploadMedia}
				handleAddPoll={handleAddPoll}
			/>
		</div>
	)
}

export default PostCreator
