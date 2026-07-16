import React from "react"
import { Checkbox } from "antd"
import Button from "@ui/Button"
import MarkdownReader from "@components/MarkdownReader"

import "./index.less"

const OptInDialog = ({ close }) => {
	const [termsAccept, setTermsAccept] = React.useState(false)
	const [submitErr, setSubmitErr] = React.useState(null)
	const [submitLoading, setSubmitLoading] = React.useState(false)

	const submit = async () => {
		setSubmitErr(null)
		setSubmitLoading(true)

		const ok = await app.cores.api
			.customRequest({
				method: "POST",
				url: "/flags/ack/spaces_preview",
				body: {
					tos_accept: termsAccept,
				},
			})
			.catch((err) => {
				setSubmitErr(err.response?.data?.error ?? err.message)
				return false
			})

		setSubmitLoading(false)

		if (ok) {
			if (typeof close === "function") {
				close()
			}
		}
	}

	return (
		<div className="spaces-optin-dialog">
			<div>
				<h1>Welcome to Spaces</h1>

				<p>
					This functionality is in development and not yet fully
					functional or stable. It's currently available for testing
					purposes and is intended for integration debugging within
					Comty services.
				</p>
			</div>

			<p>
				You can access these features through early-access if you accept
				the terms below:
			</p>

			<Button
				onClick={() =>
					app.layout.modal.open("tos-view", MarkdownReader, {
						props: {
							url: "/docs/comty-spaces-tos.md",
						},
					})
				}
			>
				Read
			</Button>

			<div className="flex-row gap-10">
				<Checkbox onChange={(e) => setTermsAccept(e.target.checked)}>
					I agree
				</Checkbox>
				<Button
					disabled={!termsAccept}
					onClick={submit}
					loading={submitLoading}
				>
					Enable
				</Button>
			</div>

			{submitErr && <code>{submitErr}</code>}
			{!termsAccept && <p>Please review and agree to continue.</p>}
		</div>
	)
}

export default OptInDialog
