import React from "react"
import { Skeleton, Button } from "antd"
import mimetypes from "mime"
import BearCarousel from "bear-react-carousel"

import ImageViewer from "@components/ImageViewer"

import ContentFailed from "../contentFailed"

import "bear-react-carousel/dist/index.css"
import "./index.less"

const renderDebug = localStorage.getItem("render_debug") === "true"

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

				app.controls.openFullImageViewer(url)
			}
		}

		const getMediaType = async () => {
			let extension = null

			// get media type by parsing the url
			const mediaExtname = /\.([a-zA-Z0-9]+)$/.exec(url)

			if (mediaExtname) {
				extension = mediaExtname[1]
			} else {
				// try to get media by creating requesting the url
				const response = await fetch(url, {
					method: "HEAD",
				})

				extension = response.headers.get("content-type").split("/")[1]
			}

			extension = extension.toLowerCase()

			if (!extension) {
				setLoaded(true)

				console.error("Failed to get media type", url, extension)

				return
			}

			const mimeType = mimetypes.getType(extension)

			setMimeType(mimeType)

			setLoaded(true)
		}

		const renderMedia = () => {
			if (!mimeType) {
				return null
			}

			switch (mimeType.split("/")[0]) {
				case "image": {
					return <ImageViewer src={url} />
				}
				case "video": {
					return (
						<video controls>
							<source src={url} type={mimeType} />
						</video>
					)
				}
				case "audio": {
					return (
						<audio controls>
							<source src={url} type={mimeType} />
						</audio>
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
			return <ContentFailed />
		}

		return (
			<div
				key={props.index}
				id={id}
				className="attachment"
				onDoubleClick={onDoubleClickAttachment}
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

export default React.memo((props) => {
	const [controller, setController] = React.useState()
	const [carouselState, setCarouselState] = React.useState()
	const [nsfwAccepted, setNsfwAccepted] = React.useState(false)

	React.useEffect(() => {
		// get attachment index from query string
		const attachmentIndex = parseInt(
			new URLSearchParams(window.location.search).get("attachment"),
		)

		if (attachmentIndex) {
			controller?.slideToPage(attachmentIndex)
		}
	}, [])

	return (
		<div className="post_attachments">
			{props.flags && props.flags.includes("nsfw") && !nsfwAccepted && (
				<div className="nsfw_alert">
					<h2>This post may contain sensitive content.</h2>

					<Button onClick={() => setNsfwAccepted(true)}>
						Show anyways
					</Button>
				</div>
			)}

			{props.attachments?.length > 0 && (
				<BearCarousel
					data={props.attachments.map((attachment, index) => {
						if (typeof attachment !== "object") {
							attachment = {
								url: attachment,
							}
						}

						return {
							key: index,
							children: (
								<React.Fragment key={index}>
									<Attachment
										index={index}
										attachment={attachment}
									/>
								</React.Fragment>
							),
						}
					})}
					isEnableNavButton
					isEnableMouseMove
					isEnablePagination
					setController={setController}
					onSlideChange={setCarouselState}
					isDebug={renderDebug}
				/>
			)}
		</div>
	)
})
