import type {
	ComposerSend,
	ComposerTyping,
	ComposerUploadProgress,
	ComposerUploadResponse,
} from "../hooks/useComposer"
import type { ReplyTarget } from "../types"

import React from "react"
import { Input } from "antd"

import Popover from "@/ui/Popover"
import Button from "@/ui/Button"
import { Icons } from "@components/Icons"
import UploadButton from "@components/UploadButton"
import ExpressionsMenu from "@components/Expressions/menu"

import useComposer from "../hooks/useComposer"
import UploadAttachments from "./UploadAttachments"

import "./InputBar.less"

interface InputMenuProps {
	close?: () => void
	onUploaderStart: (uid: string, file: File) => void
	onUploaderSuccess: (uid: string, response: ComposerUploadResponse) => void
	onUploaderProgress: (
		uid: string,
		progress?: ComposerUploadProgress | null,
	) => void
	onUploaderError: (uid: string) => void
}

const InputMenu = ({
	close,
	onUploaderStart,
	onUploaderSuccess,
	onUploaderProgress,
	onUploaderError,
}: InputMenuProps) => {
	const handleOnUploaderStart = (uid: string, file: File) => {
		if (typeof close === "function") close()

		onUploaderStart(uid, file)
	}

	return (
		<div className="channel-chat__input__area__menu">
			<UploadButton
				multiple
				onStart={handleOnUploaderStart}
				onProgress={onUploaderProgress}
				onSuccess={onUploaderSuccess}
				onError={onUploaderError}
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

interface ChatInputBarProps {
	channel_id: string
	send: ComposerSend
	typing: ComposerTyping
	replyTo: ReplyTarget | null
	onCancelReply: () => void
}

export const ChatInputBar = ({
	channel_id,
	send,
	typing,
	replyTo,
	onCancelReply,
}: ChatInputBarProps) => {
	const {
		inputValue,
		attachments,
		uploaderRef,
		textAreaRef,
		canSubmit,
		submit,
		handleMessageChange,
		handlePaste,
		injectChar,
		removeAttachment,
		onUploaderStart,
		onUploaderProgress,
		onUploaderSuccess,
		onUploaderError,
	} = useComposer({
		channel_id,
		send,
		typing,
		replyTo,
		onCancelReply,
	})

	return (
		<div className="channel-chat__input">
			{attachments.length > 0 && (
				<UploadAttachments
					items={attachments}
					onRemove={removeAttachment}
				/>
			)}

			{replyTo && (
				<div className="channel-chat__input__reply-indicator bg-accent">
					<div className="channel-chat__input__reply-indicator__content">
						<Icons.Reply className="channel-chat__input__reply-indicator__icon" />
						<div className="channel-chat__input__reply-indicator__text">
							<span className="channel-chat__input__reply-indicator__username">
								{replyTo.userName}
							</span>
							<span className="channel-chat__input__reply-indicator__message">
								{replyTo.messageText}
							</span>
						</div>
					</div>
					<Button
						type="ghost"
						icon={<Icons.X />}
						onClick={onCancelReply}
					/>
				</div>
			)}

			<div className="channel-chat__input__area bg-accent">
				<Popover
					content={InputMenu}
					contentProps={{
						onUploaderStart,
						onUploaderSuccess,
						onUploaderProgress,
						onUploaderError,
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
					onPaste={handlePaste}
					onPressEnter={submit}
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
						onError={onUploaderError}
						children={null}
					/>

					<button
						className="sendButton"
						onClick={() => submit()}
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
