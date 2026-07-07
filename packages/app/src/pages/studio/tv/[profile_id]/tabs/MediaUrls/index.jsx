import React from "react"
import * as antd from "antd"
import { Icons } from "@components/Icons"

const MediaUrls = ({ profile }) => {
	const { urls } = profile

	if (!urls || Object.keys(urls).length === 0) {
		return null
	}

	return (
		<div className="profile-section content-panel">
			<div className="profile-section__header">
				<span>
					<Icons.Link /> Medias
				</span>
			</div>

			{urls.hls && (
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
								{urls.hls}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{urls.rtsp && (
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
								{urls.rtsp}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{urls.rtspt && (
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
								{urls.rtspt}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}

			{urls.html && (
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
								{urls.html}
							</antd.Typography.Text>
						</code>
					</div>
				</div>
			)}
		</div>
	)
}

export default MediaUrls
