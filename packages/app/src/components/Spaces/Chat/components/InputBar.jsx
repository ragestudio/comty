import React from "react"
import { Input } from "antd"

import Popover from "@/ui/Popover"
import Button from "@/ui/Button"
import { Icons } from "@components/Icons"
import UploadButton from "@components/UploadButton"

import useOnPaste from "@hooks/useOnPaste"

import UploadAttachments from "./UploadAttachments"
import ExpressionsMenu from "@components/Expressions/menu"

import "./InputBar.less"

const InputMenu = ({
	close,
	onUploaderStart,
	onUploaderSuccess,
	onUploaderProgress,
}) => {
	const handleOnUploaderStart = (...args) => {
		if (typeof close === "function") close()
		if (typeof onUploaderStart === "function") onUploaderStart(...args)
	}

	return (
		<div className="channel-chat__input__area__menu">
			<UploadButton
				multiple
				onStart={handleOnUploaderStart}
				onProgress={onUploaderProgress}
				onSuccess={onUploaderSuccess}
				render={() => {
					return (
						<Button
							type="ghost"
							icon={<Icons.FileUp />}
						>
							<span>Upload a File</span>
						</Button>
					)
				}}
			/>

			<Button
				type="ghost"
				icon={<Icons.FormInput />}
				disabled
			>
				<span>Create a Poll</span>
			</Button>
		</div>
	)
}

export const ChatInputBar = ({ channel_id, send, typing }) => {
	const [inputValue, setInputValue] = React.useState("")
	const [attachments, setAttachments] = React.useState([])

	const uploaderRef = React.useRef(null)
	const textAreaRef = React.useRef(null)

	const canSubmit = () => {
		if (attachments.some((item) => item.pending)) {
			return false
		}

		if (inputValue.trim().length === 0 && attachments.length === 0) {
			return false
		}

		return true
	}

	const handleMessageChange = React.useCallback((e) => {
		setInputValue(e.target.value)

		if (e.target.value.length === 0) {
			typing(false)
		} else {
			typing(true)
		}
	}, [])

	const submit = async () => {
		if (!canSubmit()) {
			console.warn("Can't submit empty message")
			return false
		}

		const message = inputValue.trim()

		const response = await send({
			message: message,
			attachments: attachments,
		}).catch((e) => {
			console.error(e)
			return null
		})

		if (response) {
			setInputValue("")
			setAttachments([])
		}
	}

	const onUploaderStart = React.useCallback((uid, file) => {
		setAttachments((prev) => [
			...prev,
			{
				uid: uid,
				file: file,
				pending: true,
				progress: 0,
			},
		])
	}, [])

	const onUploaderProgress = React.useCallback((uid, progress) => {
		setAttachments((prev) =>
			prev.map((item) => {
				if (item.uid !== uid) {
					return item
				}

				return {
					...item,
					progress: progress?.percent ?? 0,
				}
			}),
		)
	}, [])

	const onUploaderSuccess = React.useCallback((uid, response) => {
		setAttachments((prev) => {
			return prev.map((file) => {
				if (file.uid !== uid) {
					return file
				}

				return {
					...file,
					url: response.url,
					hash: response.metadata?.["File-Hash"],
					pending: false,
				}
			})
		})
	}, [])

	const removeAttachment = React.useCallback((uid) => {
		setAttachments((prev) => prev.filter((item) => item.uid !== uid))
	}, [])

	const injectChar = React.useCallback(
		(char) => {
			handleMessageChange({
				target: {
					value: textAreaRef.current?.nativeElement?.value + char,
				},
			})
		},
		[textAreaRef],
	)

	useOnPaste((event) => {
		const { clipboardData } = event

		if (clipboardData) {
			let file = Array.from(clipboardData.items).find(
				(item) => item.kind === "file",
			)

			if (file) {
				event.preventDefault()
				uploaderRef.current.uploadFile(file.getAsFile())
			}
		}
	})

	// Reset state when changing channels
	React.useEffect(() => {
		setInputValue("")
		setAttachments([])
	}, [channel_id])

	return (
		<div className="channel-chat__input">
			{attachments.length > 0 && (
				<UploadAttachments
					items={attachments}
					onRemove={removeAttachment}
				/>
			)}

			<div className="channel-chat__input__area bg-accent">
				<Popover
					content={InputMenu}
					contentProps={{
						onUploaderStart,
						onUploaderSuccess,
						onUploaderProgress,
					}}
				>
					<Button icon={<Icons.Plus />} />
				</Popover>

				<Input.TextArea
					ref={textAreaRef}
					name="message"
					id="message"
					placeholder="Type a message..."
					autoSize={{ minRows: 1, maxRows: 5 }}
					value={inputValue}
					onChange={handleMessageChange}
					onPressEnter={(e) => {
						e.preventDefault()
						submit()
					}}
					maxLength={1200} // TODO: get from server
				/>

				<div className="channel-chat__input__area__buttons">
					<ExpressionsMenu
						send={send}
						injectChar={injectChar}
					/>

					<UploadButton
						multiple
						ref={uploaderRef}
						onStart={onUploaderStart}
						onProgress={onUploaderProgress}
						onSuccess={onUploaderSuccess}
						children={null}
					/>

					<button
						className="sendButton"
						onClick={submit}
						disabled={!canSubmit()}
					>
						<Icons.Send />
					</button>
				</div>
			</div>
		</div>
	)
}

export const MemoizedChatInputBar = React.memo(ChatInputBar)

export default MemoizedChatInputBar
