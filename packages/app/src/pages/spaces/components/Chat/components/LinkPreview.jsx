import React from "react"
import PropTypes from "prop-types"
import axios from "axios"

import Attachments from "@components/AttachmentsGrid"

const LinkPreview = React.memo(({ url }) => {
	const [headers, setHeaders] = React.useState(null)

	const loadHead = React.useCallback(async () => {
		if (!url) {
			return
		}

		const composedUrl =
			app.cores.api.client().mainOrigin +
			"/main/query_url" +
			"?url=" +
			url

		const result = await axios({
			method: "GET",
			url: composedUrl,
		}).catch(() => {
			return null
		})

		if (result) {
			setHeaders(result.data.remoteHeaders)
		}
	}, [url])

	React.useEffect(() => {
		loadHead()
	}, [url, loadHead])

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
})

LinkPreview.displayName = "LinkPreview"

LinkPreview.propTypes = {
	url: PropTypes.string.isRequired,
}

export default LinkPreview
