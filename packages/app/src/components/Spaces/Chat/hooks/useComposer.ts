import type { TextAreaRef } from "antd/es/input/TextArea"

import React from "react"

import type { ReplyTarget } from "../types"

export interface ComposerAttachment {
	uid: string
	file: File
	pending: boolean
	progress: number
	url?: string
	hash?: string
}

export interface ComposerUploader {
	uploading: boolean
	progress: unknown
	uploadFile: (file: File) => void
}

export interface ComposerUploadProgress {
	percent?: number
}

export interface ComposerUploadResponse {
	url?: string
	metadata?: Record<string, string>
}

export interface ComposerSendPayload {
	message: string
	attachments: ComposerAttachment[]
	reply_to_id?: string
}

export type ComposerSend = (
	payload: ComposerSendPayload,
) => Promise<boolean | null>

export type ComposerTyping = (isTypingNow?: boolean) => void

export interface UseComposerOptions {
	channel_id: string
	send: ComposerSend
	typing: ComposerTyping
	replyTo: ReplyTarget | null
	onCancelReply?: () => void
}

export default function useComposer({
	channel_id,
	send,
	typing,
	replyTo,
	onCancelReply,
}: UseComposerOptions) {
	const [inputValue, setInputValue] = React.useState("")
	const [attachments, setAttachments] = React.useState<ComposerAttachment[]>(
		[],
	)

	const uploaderRef = React.useRef<ComposerUploader | null>(null)
	const textAreaRef = React.useRef<TextAreaRef | null>(null)

	const canSubmit = () => {
		if (attachments.some((item) => item.pending)) {
			return false
		}

		if (inputValue.trim().length === 0 && attachments.length === 0) {
			return false
		}

		return true
	}

	const handleMessageChange = React.useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInputValue(event.target.value)

			if (event.target.value.length === 0) {
				typing(false)
			} else {
				typing(true)
			}
		},
		[typing],
	)

	const submit = async (event?: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event?.shiftKey === true) {
			return
		}

		event?.preventDefault?.()

		if (!canSubmit()) {
			console.warn("Can't submit empty message")
			return false
		}

		const message = inputValue.trim()

		const response = await send({
			message,
			attachments,
			reply_to_id: replyTo?.messageId,
		}).catch((error) => {
			console.error(error)
			return null
		})

		if (response) {
			setInputValue("")
			setAttachments([])

			if (typeof onCancelReply === "function") {
				onCancelReply()
			}
		}
	}

	const onUploaderStart = React.useCallback((uid: string, file: File) => {
		setAttachments((previous) => [
			...previous,
			{
				uid,
				file,
				pending: true,
				progress: 0,
			},
		])
	}, [])

	const onUploaderProgress = React.useCallback(
		(uid: string, progress?: ComposerUploadProgress | null) => {
			setAttachments((previous) =>
				previous.map((item) => {
					if (item.uid !== uid) {
						return item
					}

					return {
						...item,
						progress: progress?.percent ?? 0,
					}
				}),
			)
		},
		[],
	)

	const onUploaderSuccess = React.useCallback(
		(uid: string, response: ComposerUploadResponse) => {
			setAttachments((previous) =>
				previous.map((item) => {
					if (item.uid !== uid) {
						return item
					}

					return {
						...item,
						url: response.url,
						hash: response.metadata?.["File-Hash"],
						pending: false,
					}
				}),
			)
		},
		[],
	)

	const onUploaderError = React.useCallback((uid: string) => {
		setAttachments((previous) =>
			previous.filter((item) => item.uid !== uid),
		)
	}, [])

	const removeAttachment = React.useCallback((uid: string) => {
		setAttachments((previous) =>
			previous.filter((item) => item.uid !== uid),
		)
	}, [])

	const injectChar = React.useCallback(
		(char: string) => {
			setInputValue((previous) => previous + char)
			typing(true)

			textAreaRef.current?.focus()
		},
		[typing],
	)

	const handlePaste = React.useCallback(
		(event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const items = Array.from(event.clipboardData?.items ?? [])
			const fileItem = items.find((item) => item.kind === "file")
			const file = fileItem?.getAsFile()

			if (!file) return

			event.preventDefault()
			uploaderRef.current?.uploadFile(file)
		},
		[],
	)

	// reset state when changing channels
	React.useEffect(() => {
		setInputValue("")
		setAttachments([])
	}, [channel_id])

	// focus the textarea when a reply is initiated
	React.useEffect(() => {
		if (replyTo && textAreaRef.current) {
			textAreaRef.current.focus()
		}
	}, [replyTo])

	return {
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
	}
}
