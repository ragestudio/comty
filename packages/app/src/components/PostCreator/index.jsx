import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DateTime } from "luxon"
import lodash from "lodash"
import humanSize from "@tsmx/human-readable"

import PostLink from "@components/PostLink"
import { Icons } from "@components/Icons"
import Poll from "@components/Poll"

import clipboardEventFileToFile from "@utils/clipboardEventFileToFile"

import PostModel from "@models/post"
import SearchModel from "@models/search"

import "./index.less"

const DEFAULT_POST_POLICY = {
	maxMessageLength: 512,
	acceptedMimeTypes: [
		"image/gif",
		"image/png",
		"image/jpeg",
		"image/bmp",
		"video/mp4",
		"video/webm",
		"video/quicktime",
	],
	maximunFilesPerRequest: 10,
}

const VisibilityOptionLabel = ({ label, icon }) => (
	<div
		style={{
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "10px",
		}}
	>
		{icon}
		{label}
	</div>
)

const visibilityOptions = [
	{
		value: "public",
		label: <VisibilityOptionLabel icon={<Icons.FiUser />} label="Public" />,
	},
	{
		value: "private",
		label: (
			<VisibilityOptionLabel icon={<Icons.FiEyeOff />} label="Private" />
		),
	},
]

export default class PostCreator extends React.Component {
	state = {
		pending: [],
		loading: false,
		uploaderVisible: false,

		postMessage: "",
		postAttachments: [],
		postPoll: null,
		postVisibility: "public",

		fileList: [],
		postingPolicy: DEFAULT_POST_POLICY,

		mentionsLoadedData: [],
	}

	pollRef = React.createRef()

	creatorRef = React.createRef()

	cleanPostData = () => {
		this.setState({
			postMessage: "",
			postAttachments: [],
			fileList: [],
		})
	}

	toggleUploaderVisibility = (to) => {
		to = to ?? !this.state.uploaderVisible

		if (to === this.state.uploaderVisible) {
			return
		}

		this.setState({
			uploaderVisible: to,
		})
	}

	canSubmit = () => {
		const { postMessage, postAttachments, pending, postingPolicy } =
			this.state

		const messageLengthValid =
			postMessage.length !== 0 &&
			postMessage.length < postingPolicy.maxMessageLength

		if (pending.length !== 0) {
			return false
		}

		if (!messageLengthValid && postAttachments.length === 0) {
			return false
		}

		return true
	}

	submit = lodash.debounce(async () => {
		if (this.state.loading) {
			return false
		}

		if (!this.canSubmit()) {
			return false
		}

		await this.setState({
			loading: true,
			uploaderVisible: false,
		})

		const { postMessage, postAttachments } = this.state

		const payload = {
			message: postMessage,
			attachments: postAttachments,
			timestamp: DateTime.local().toISO(),
			visibility: this.state.postVisibility,
		}

		if (this.pollRef.current) {
			let { options } = this.pollRef.current.getFieldsValue()

			payload.poll_options = options.filter((option) => !!option.label)
		}

		let response = null

		if (this.props.reply_to) {
			payload.reply_to = this.props.reply_to
		}

		if (this.props.edit_post) {
			response = await PostModel.update(
				this.props.edit_post,
				payload,
			).catch((error) => {
				console.error(error)
				antd.message.error(error)

				return false
			})
		} else {
			response = await PostModel.create(payload).catch((error) => {
				console.error(error)
				antd.message.error(error)

				return false
			})
		}

		this.setState({
			loading: false,
		})

		if (response) {
			this.cleanPostData()

			if (typeof this.props.onPost === "function") {
				this.props.onPost()
			}

			if (typeof this.props.close === "function") {
				this.props.close()
			}

			if (this.props.reply_to) {
				app.navigation.goToPost(this.props.reply_to)
			}
		}
	}, 50)

	uploadFile = async (req) => {
		this.toggleUploaderVisibility(false)

		const request = await app.cores.remoteStorage
			.uploadFile(req.file)
			.catch((error) => {
				console.error(error)
				antd.message.error(error)

				req.onError(error)

				return false
			})

		if (request) {
			console.log(`Upload done >`, request)

			return req.onSuccess(request)
		}
	}

	removeAttachment = (file_uid) => {
		this.setState({
			postAttachments: this.state.postAttachments.filter(
				(file) => file.uid !== file_uid,
			),
			fileList: this.state.fileList.filter(
				(file) => file.uid !== file_uid,
			),
		})
	}

	addAttachment = (file) => {
		if (Array.isArray(file)) {
			return this.setState({
				postAttachments: [...this.state.postAttachments, ...file],
			})
		}

		return this.setState({
			postAttachments: [...this.state.postAttachments, file],
		})
	}

	uploaderScrollToEnd = () => {
		// scroll to max right
		const element = document.querySelector(".ant-upload-list-picture-card")

		// calculate the element's width and scroll to the end
		const scrollToLeft = element.scrollWidth - element.clientWidth

		if (element) {
			element.scrollTo({
				top: 0,
				left: scrollToLeft,
				behavior: "smooth",
			})
		}
	}

	onUploaderChange = (change) => {
		if (this.state.fileList !== change.fileList) {
			this.setState({
				fileList: change.fileList,
			})
		}

		switch (change.file.status) {
			case "uploading": {
				this.toggleUploaderVisibility(false)

				this.setState({
					pending: [...this.state.pending, change.file.uid],
				})

				this.uploaderScrollToEnd()

				break
			}
			case "done": {
				// remove pending file
				this.setState({
					pending: this.state.pending.filter(
						(uid) => uid !== change.file.uid,
					),
				})

				if (Array.isArray(change.file.response.files)) {
					change.file.response.files.forEach((file) => {
						this.addAttachment(file)
					})
				} else {
					this.addAttachment(change.file.response)
				}

				// scroll to end
				this.uploaderScrollToEnd()

				break
			}
			case "error": {
				// remove pending file
				this.setState({
					pending: this.state.pending.filter(
						(uid) => uid !== change.file.uid,
					),
				})

				// remove file from list
				this.removeAttachment(change.file.uid)
			}
			default: {
				break
			}
		}
	}

	handleMessageInputChange = (inputText) => {
		// if the fist character is a space or a whitespace remove it
		if (inputText[0] === " " || inputText[0] === "\n") {
			inputText = inputText.slice(1)
		}

		this.setState({
			postMessage: inputText,
		})
	}

	handleMessageInputKeydown = async (e) => {
		// detect if the user pressed `enter` key and submit the form, but only if the `shift` key is not pressed
		if (e.keyCode === 13 && !e.shiftKey) {
			e.preventDefault()
			e.stopPropagation()

			if (this.state.loading) {
				return false
			}

			return await this.submit()
		}
	}

	handleOnMentionSearch = lodash.debounce(async (value) => {
		if (value === "") {
			return false
		}

		const results = await SearchModel.search(`${value}`, {
			fields: "users",
			limit: 5,
		})

		this.setState({
			mentionsLoadedData: results.users.items,
		})
	}, 300)

	updateFileList = (uid, newValue) => {
		let updatedFileList = this.state.fileList

		// find the file in the list
		const index = updatedFileList.findIndex((file) => file.uid === uid)

		// update the file
		updatedFileList[index] = newValue

		// update the state
		this.setState({
			fileList: updatedFileList,
		})

		return updatedFileList
	}

	handleManualUpload = async (file) => {
		if (!file) {
			throw new Error(`No file provided`)
		}

		const isValidFormat = (fileType) => {
			return this.state.postingPolicy.acceptedMimeTypes.includes(fileType)
		}

		if (!isValidFormat(file.type)) {
			app.cores.notifications.new({
				type: "error",
				title: `Invalid format (${file.type})`,
				message:
					"Only the following file formats are allowed: " +
					this.state.postingPolicy.acceptedMimeTypes.join(", "),
			})
			return null
			throw new Error(`Invalid file format`)
		}

		file.thumbUrl = URL.createObjectURL(file)
		file.uid = `${file.name}-${Math.random() * 1000}`

		file.status = "uploading"

		// add file to the uploader
		this.onUploaderChange({
			file,
			fileList: [...this.state.fileList, file],
		})

		// upload the file
		await this.uploadFile({
			file,
			onSuccess: (response) => {
				file.status = "done"
				file.response = response

				this.onUploaderChange({
					file: file,
					fileList: this.updateFileList(file.uid, file),
				})
			},
			onError: (error) => {
				file.status = "error"
				file.error = error

				this.onUploaderChange({
					file: file,
					fileList: this.updateFileList(file.uid, file),
				})
			},
		})

		return file
	}

	handlePaste = async ({ clipboardData }) => {
		if (clipboardData && clipboardData.items.length > 0) {
			// check if the clipboard contains a file
			const hasFile = Array.from(clipboardData.items).some(
				(item) => item.kind === "file",
			)

			if (!hasFile) {
				return false
			}

			for (let index = 0; index < clipboardData.items.length; index++) {
				const item = clipboardData.items[index]

				let file = await clipboardEventFileToFile(item).catch(
					(error) => {
						console.error(error)
						app.message.error(
							`Failed to upload file:`,
							error.message,
						)

						return false
					},
				)

				this.handleManualUpload(file).catch((error) => {
					console.error(error)
					return false
				})
			}
		}
	}

	handleVisibilityChange = (key) => {
		this.setState({ postVisibility: key })
	}

	renderUploadPreviewItem = (item, file, list, actions) => {
		const uploading = file.status === "uploading"

		const onClickDelete = () => {
			this.removeAttachment(file.uid)
		}

		return (
			<div className={classnames("file", { ["uploading"]: uploading })}>
				<div className="preview">
					<img src={file.thumbUrl ?? "/assets/new_file.png"} />
				</div>

				<div className="actions">
					{uploading && (
						<Icons.LoadingOutlined
							style={{ margin: "0 !important" }}
						/>
					)}
					{!uploading && (
						<antd.Popconfirm
							title="Are you sure you want to delete this file?"
							onConfirm={onClickDelete}
						>
							<antd.Button type="link" icon={<Icons.FiTrash />} />
						</antd.Popconfirm>
					)}
				</div>
			</div>
		)
	}

	handleDrag = (event) => {
		event.preventDefault()
		event.stopPropagation()

		console.log(event)

		if (event.type === "dragenter") {
			this.toggleUploaderVisibility(true)
		} else if (event.type === "dragleave") {
			// check if mouse is over the uploader or outside the creatorRef
			if (
				this.state.uploaderVisible &&
				!this.creatorRef.current.contains(event.target)
			) {
				this.toggleUploaderVisibility(false)
			}
		}
	}

	handleUploadClick = () => {
		// create a new dialog
		const dialog = document.createElement("input")

		// set the dialog type to file
		dialog.type = "file"

		// set the dialog accept to the accepted files
		dialog.accept = this.state.postingPolicy.acceptedMimeTypes

		dialog.multiple = true

		// add a listener to the dialog
		dialog.addEventListener("change", (event) => {
			// get the files
			const files = event.target.files

			// loop through the files
			for (let index = 0; index < files.length; index++) {
				const file = files[index]

				this.handleManualUpload(file).catch((error) => {
					console.error(error)
					return false
				})
			}
		})

		// click the dialog
		dialog.click()
	}

	handleAddPoll = () => {
		if (!this.state.postPoll) {
			this.setState({
				postPoll: [],
			})
		}
	}

	handleDeletePoll = () => {
		this.setState({
			postPoll: null,
		})
	}

	componentDidMount = async () => {
		if (this.props.edit_post) {
			await this.setState({
				loading: true,
				postId: this.props.edit_post,
			})

			const post = await PostModel.getPost({
				post_id: this.props.edit_post,
			})

			await this.setState({
				loading: false,
				postMessage: post.message,
				postAttachments: post.attachments.map((attachment) => {
					return {
						...attachment,
						uid: attachment.id,
					}
				}),
				fileList: post.attachments.map((attachment) => {
					return {
						...attachment,
						uid: attachment.id,
						id: attachment.id,
						thumbUrl: attachment.url,
						status: "done",
					}
				}),
				postPoll: post.poll_options,
				postVisibility: post.visibility,
			})
		}
		// fetch the posting policy
		//this.fetchUploadPolicy()

		// add a listener to the window
		document.addEventListener("paste", this.handlePaste)
	}

	componentWillUnmount() {
		document.removeEventListener("paste", this.handlePaste)
	}

	componentDidUpdate(prevProps, prevState) {
		// if pending is not empty and is not loading
		if (this.state.pending.length > 0 && !this.state.loading) {
			this.setState({ loading: true })
		} else if (this.state.pending.length === 0 && this.state.loading) {
			this.setState({ loading: false })
		}
	}

	render() {
		const {
			postMessage,
			fileList,
			loading,
			uploaderVisible,
			postingPolicy,
		} = this.state

		const editMode = !!this.props.edit_post

		const showHeader = !!this.props.edit_post || this.props.reply_to

		return (
			<div
				className={"postCreator"}
				ref={this.creatorRef}
				onDragEnter={this.handleDrag}
				onDragLeave={this.handleDrag}
				style={this.props.style}
			>
				{showHeader && (
					<div className="postCreator-header">
						{this.props.edit_post && (
							<div className="postCreator-header-indicator">
								<p>
									<Icons.MdEdit />
									Editing post
								</p>
							</div>
						)}

						{this.props.reply_to && (
							<div className="postCreator-header-indicator">
								<p>
									<Icons.MdReply />
									Replaying to
								</p>

								<PostLink
									post_id={this.props.reply_to}
									onClick={() => {
										this.props.close()
										app.navigation.goToPost(
											this.props.reply_to,
										)
									}}
								/>
							</div>
						)}
					</div>
				)}

				<div className="textInput">
					<div className="avatar">
						<img src={app.userData?.avatar} />
					</div>

					<antd.Mentions
						placeholder="What are you thinking?"
						value={postMessage}
						autoSize={{ minRows: 3, maxRows: 6 }}
						maxLength={postingPolicy.maxMessageLength}
						onChange={this.handleMessageInputChange}
						onKeyDown={this.handleMessageInputKeydown}
						disabled={loading}
						draggable={false}
						prefix="@"
						allowClear
						onBlur={() => {
							this.setState({ mentionsLoadedData: [] })
						}}
						options={this.state.mentionsLoadedData.map((item) => {
							return {
								key: item.id,
								value: item.username,
								label: (
									<>
										<antd.Avatar
											size={24}
											src={item.avatar}
											shape="square"
										/>
										<span>{item.username}</span>
									</>
								),
							}
						})}
						onSearch={this.handleOnMentionSearch}
					/>

					<div>
						<antd.Button
							type="primary"
							disabled={loading || !this.canSubmit()}
							onClick={this.submit}
							icon={
								loading ? (
									<Icons.LoadingOutlined spin />
								) : editMode ? (
									<Icons.MdEdit />
								) : (
									<Icons.FiSend />
								)
							}
						/>
					</div>
				</div>

				<div
					className={classnames("uploader", {
						["visible"]: uploaderVisible,
					})}
				>
					<antd.Upload.Dragger
						openFileDialogOnClick={false}
						maxCount={postingPolicy.maximunFilesPerRequest}
						onChange={this.onUploaderChange}
						customRequest={this.uploadFile}
						accept={postingPolicy.acceptedMimeTypes}
						fileList={fileList}
						listType="picture-card"
						itemRender={this.renderUploadPreviewItem}
						multiple
					>
						<div className="hint">
							<h3>Drag and drop files here</h3>
							<span>
								Max{" "}
								{humanSize.fromBytes(
									postingPolicy.maximumFileSize,
								)}
							</span>
						</div>
					</antd.Upload.Dragger>
				</div>

				{this.state.postPoll && (
					<Poll
						formRef={this.pollRef}
						options={this.state.postPoll}
						onClose={this.handleDeletePoll}
						editMode
					/>
				)}

				<div className="actions">
					<antd.Button
						type="ghost"
						onClick={this.handleUploadClick}
						icon={<Icons.FiUpload />}
					/>

					<antd.Button
						type="ghost"
						icon={<Icons.MdPoll />}
						onClick={this.handleAddPoll}
					/>

					<antd.Select
						id="post-visibility"
						size="small"
						value={this.state.postVisibility}
						onChange={this.handleVisibilityChange}
						options={visibilityOptions}
					/>
				</div>
			</div>
		)
	}
}
