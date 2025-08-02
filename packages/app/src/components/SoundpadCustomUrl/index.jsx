import React from "react"
import { Button, Input } from "antd"

import isUrl from "@utils/isURL"

import "./index.less"

const SoundpadCustomUrl = ({ dispatch }) => {
	const [url, setUrl] = React.useState("")
	const [error, setError] = React.useState(null)
	const [submitting, setSubmitting] = React.useState(false)

	const submit = async () => {
		setError(null)

		if (!isUrl(url) || !url.startsWith("https://")) {
			setError("Invalid URL")
			return
		}

		setSubmitting(true)

		await dispatch(url)

		setSubmitting(false)
	}

	return (
		<div className="soundpad-dialog__custom-url">
			<div className="soundpad-dialog__custom-url__header">
				<h3>Custom URL (max 10 seconds)</h3>
				<span>Only HTTPS URLs are supported</span>
			</div>

			<Input
				type="text"
				placeholder="URL"
				variant="borderless"
				value={url}
				status={error ? "error" : null}
				onChange={(e) => setUrl(e.target.value)}
				onPressEnter={submit}
				disabled={submitting}
				suffix={
					<Button
						loading={submitting}
						onClick={submit}
					>
						Send
					</Button>
				}
			/>
		</div>
	)
}

export default SoundpadCustomUrl
