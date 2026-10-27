import React from "react"
import PropTypes from "prop-types"
import axios from "axios"

import Attachments from "@components/AttachmentsGrid"
import client from "comty.js/core/client"

const headersCache = new Map()

/** @param {{ url: string }} props */
const LinkPreviewComponent = ({ url }) => {
	const [headers, setHeaders] = React.useState(null)

	React.useEffect(() => {
		if (!url) return

		const cached = headersCache.get(url)

		if (cached) {
			setHeaders(cached)
			return
		}

		const controller = new AbortController()
		let active = true

		const loadHead = async () => {
			const composedUrl =
				client.origin +
				"/main/query_url" +
				"?url=" +
				encodeURIComponent(url)

			const result = await axios({
				method: "GET",
				url: composedUrl,
				signal: controller.signal,
			}).catch(() => null)

			if (!active || !result) return

			const remoteHeaders = result.data?.remoteHeaders ?? null

			if (remoteHeaders) {
				headersCache.set(url, remoteHeaders)
			}

			setHeaders(remoteHeaders)
		}

		loadHead()

		return () => {
			active = false
			controller.abort()
		}
	}, [url])

	if (headers && headers["content-type"]) {
		const [type] = headers["content-type"].split("/")

		if (type === "audio") {
			return (
				<audio
					controls
					src={url}
				/>
			)
		}

		if (type === "image") {
			return (
				<Attachments
					attachments={[{ url }]}
					className="channel-chat__timeline__line__content__body__attachments"
				/>
			)
		}
	}

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
		>
			{url}
		</a>
	)
}

const LinkPreview = React.memo(LinkPreviewComponent)

LinkPreview.displayName = "LinkPreview"

export default LinkPreview
