import React from "react"
import { Input } from "antd"

import useOnPaste from "@hooks/useOnPaste"
import UploadButton from "@components/UploadButton"

import Attachments from "./Attachments"

const ChatInputBar = React.memo(({ channel_id, send, typing }) => {
	const [inputValue, setInputValue] = React.useState("")
	const [attachments, setAttachments] = React.useState([])

	const uploaderRef = React.useRef()

	const handleMessageChange = React.useCallback((e) => {
		setInputValue(e.target.value)

		if (e.target.value.length === 0) {
			typing(false)
		} else {
			typing(true)
		}
	}, [])

	const submit = async () => {
		if (uploaderRef.current?.uploading) {
			return false
		}

		const message = inputValue.trim()

		if (message.length === 0 && attachments.length === 0) {
			return false
		}

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
			},
		])
	}, [])

	const onUploaderSuccess = React.useCallback((uid, response) => {
		setAttachments((prev) => {
			// find the file in the list
			const index = [...prev].findIndex((file) => file.uid === uid)

			// update the file
			prev[index].url = response.url
			prev[index].hash = response.metadata["File-Hash"]
			prev[index].pending = false

			return prev
		})
	}, [])

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
			{attachments.length > 0 && <Attachments items={attachments} />}

			<div className="channel-chat__input__inputs">
				<Input.TextArea
					placeholder="Type a message..."
					autoSize={{ minRows: 1, maxRows: 5 }}
					value={inputValue}
					onChange={handleMessageChange}
					onPressEnter={(e) => {
						e.preventDefault()
						submit()
					}}
					maxLength={1200} // TODO: get from server
					showCount
				/>

				<UploadButton
					multiple
					ref={uploaderRef}
					onStart={onUploaderStart}
					onSuccess={onUploaderSuccess}
				/>
			</div>
		</div>
	)
})

export default ChatInputBar
