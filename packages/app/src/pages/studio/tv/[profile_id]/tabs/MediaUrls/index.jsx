import React from "react"
import * as antd from "antd"
import { FiLink } from "react-icons/fi"

const MediaUrls = ({ profile }) => {
	const { sources } = profile

	if (!sources || Object.keys(sources).length === 0) {
		return null
	}

	const { hls, rtsp, html } = sources

	let rtspt = null

	if (rtsp) {
		try {
			const url = new URL(rtsp)

			const pathParts = url.pathname.split("/")
			const lastPart = pathParts.pop()
			const [resource, query] = lastPart.split("?")

			let stoken = url.searchParams.get("stoken")

			let newLastPart = resource

			if (stoken) {
				newLastPart = `${resource}:${stoken}`
			}

			pathParts.push(newLastPart)

			url.protocol = "rtspt:"
			url.pathname = pathParts.join("/")
			url.search = ""

			rtspt = url.toString()
		} catch (err) {
			rtspt = rtsp.replace("rtsp://", "rtspt://")
		}
	}

	return (
		<div className="profile-section content-panel">
			<div className="profile-section__header">
				<span>
					<FiLink /> Medias
				</span>
			</div>

			{hls && (
				<div className="data-field">
					<div className="data-field__label">
						<span>HLS</span>
					</div>

					<div className="data-field__description">
						<p>
							This protocol is highly compatible with a multitude
							of devices and services. Recommended for general
							use.
						</p>
					</div>

					<div className="data-field__value">
						<code>
							<antd.Typography.Text
								copyable={{
									tooltips: ["Copy HLS URL", "Copied!"],
								}}
							>
								{hls}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{rtsp && (
				<div className="data-field">
					<div className="data-field__label">
						<span>RTSP [tcp]</span>
					</div>
					<div className="data-field__description">
						<p>
							This protocol has the lowest possible latency and
							the best quality. A compatible player is required.
						</p>
					</div>
					<div className="data-field__value">
						<code>
							<antd.Typography.Text
								copyable={{
									tooltips: ["Copy RTSP URL", "Copied!"],
								}}
							>
								{rtsp}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{rtspt && (
				<div className="data-field">
					<div className="data-field__label">
						<span>RTSPT [vrchat]</span>
					</div>
					<div className="data-field__description">
						<p>
							This protocol has the lowest possible latency and
							the best quality available. Only works for VRChat
							video players.
						</p>
					</div>
					<div className="data-field__value">
						<code>
							<antd.Typography.Text
								copyable={{
									tooltips: ["Copy RTSPT URL", "Copied!"],
								}}
							>
								{rtspt}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{html && (
				<div className="data-field">
					<div className="data-field__label">
						<span>HTML Viewer</span>
					</div>
					<div className="data-field__description">
						<p>
							Share a link to easily view your stream on any
							device with a web browser.
						</p>
					</div>
					<div className="data-field__value">
						<code>
							<antd.Typography.Text
								copyable={{
									tooltips: [
										"Copy HTML Viewer URL",
										"Copied!",
									],
								}}
							>
								{html}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}
		</div>
	)
}

export default MediaUrls
