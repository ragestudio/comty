import React from "react"
import classNames from "classnames"
import { Icons } from "@components/Icons"
import { Skeleton, Button } from "antd"
import mime from "mime"

import Image from "@components/Image"

import "./index.less"

const Attachment = React.memo((props) => {
	const [loaded, setLoaded] = React.useState(false)
	const [nsfwAccepted, setNsfwAccepted] = React.useState(false)
	const [mimeType, setMimeType] = React.useState(null)

	try {
		const { url, id } = props.attachment

		const onDoubleClickAttachment = (e) => {
			if (mimeType.split("/")[0] === "image") {
				e.preventDefault()
				e.stopPropagation()

				if (
					props.attachment.flags &&
					props.attachment.flags.includes("nsfw") &&
					!nsfwAccepted
				) {
					return false
				}

				app.controls.openFullImageViewer(
					props.attachments.map((item) => item.url),
					{
						index: props.index,
					},
				)
			}
		}

		const getMediaType = async () => {
			setLoaded(false)

			let mimetype = null

			// get media type by parsing the url
			const mediaExtname = /\.([a-zA-Z0-9]+)$/.exec(url)

			if (mediaExtname) {
				mimetype = mime.getType(mediaExtname[1])
			} else {
				// try to get media by creating requesting the url
				const response = await fetch(url, {
					method: "HEAD",
				})

				mimetype = response.headers.get("content-type")
			}

			mimetype = mimetype.toLowerCase()

			if (!mimetype) {
				setLoaded(true)

				console.error("Failed to get media type", url, mimetype)

				return
			}

			setMimeType(mimetype)
			setLoaded(true)
		}

		const renderMedia = () => {
			if (!mimeType) {
				return null
			}

			switch (mimeType.split("/")[0]) {
				case "image": {
					return <Image src={url} />
				}
				case "video": {
					return (
						<video
							controls
							src={url}
							type={mimeType}
						/>
					)
				}
				case "audio": {
					return (
						<audio
							controls
							src={url}
							type={mimeType}
						/>
					)
				}
				default: {
					return <h4>Unsupported media type [{mimeType}]</h4>
				}
			}
		}

		React.useEffect(() => {
			getMediaType()
		}, [])

		if (!loaded) {
			return <Skeleton active />
		}

		if (loaded && !mimeType) {
			return (
				<div className="attachment failed">
					<Icons.CloudOff />
				</div>
			)
		}

		return (
			<div
				key={props.index}
				id={id}
				className="attachment"
				onClick={onDoubleClickAttachment}
			>
				{props.attachment.flags &&
					props.attachment.flags.includes("nsfw") &&
					!nsfwAccepted && (
						<div className="nsfw_alert">
							<h2>This media may contain sensitive content</h2>

							<Button onClick={() => setNsfwAccepted(true)}>
								Show anyways
							</Button>
						</div>
					)}
				{renderMedia()}
			</div>
		)
	} catch (error) {
		console.error(error)

		return <ContentFailed />
	}
})

Attachment.displayName = "Attachment"

const AttachmentsGrid = ({ attachments, className, style }) => {
	return (
		<div
			data-count={attachments.length}
			className={classNames("attachments-grid", className)}
			style={style}
		>
			{attachments.map((attachment, index) => {
				if (typeof attachment !== "object") {
					attachment = {
						url: attachment,
					}
				}

				return (
					<Attachment
						key={index}
						index={index}
						attachment={attachment}
						attachments={attachments}
					/>
				)
			})}
		</div>
	)
}

export default AttachmentsGrid
