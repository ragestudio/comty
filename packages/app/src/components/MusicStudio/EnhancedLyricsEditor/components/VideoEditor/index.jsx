import React from "react"
import * as antd from "antd"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"
import VideoPlayer from "@components/VideoPlayer"

import "./index.less"

dayjs.extend(customParseFormat)

const VideoEditor = (props) => {
	function handleChange(key, value) {
		if (typeof props.onChange !== "function") {
			return false
		}

		props.onChange(key, value)
	}

	return (
		<div className="video-editor">
			<h1>
				<Icons.MdVideocam />
				Video
			</h1>

			{!props.videoSourceURL && (
				<antd.Empty
					image={<Icons.MdVideocam />}
					description="No video"
				/>
			)}

			{props.videoSourceURL && (
				<div className="video-editor-preview">
					<VideoPlayer
						controls={[
							"play",
							"current-time",
							"seek-time",
							"duration",
							"progress",
							"settings",
						]}
						src={props.videoSourceURL}
					/>
				</div>
			)}

			<div className="flex-column align-start gap10">
				<div className="flex-row align-center gap10">
					<span>
						<Icons.MdAccessTime />
						Start video sync at
					</span>

					<code>{props.startSyncAt ?? "not set"}</code>
				</div>

				<div className="flex-row align-center gap10">
					<span>Set to:</span>

					<antd.TimePicker
						showNow={false}
						defaultValue={
							props.startSyncAt &&
							dayjs(props.startSyncAt, "mm:ss:SSS")
						}
						format={"mm:ss:SSS"}
						onChange={(time, str) => {
							handleChange("startSyncAt", str)
						}}
					/>
				</div>
			</div>

			<div className="video-editor-actions">
				<UploadButton
					onSuccess={(id, response) => {
						handleChange("videoSourceURL", response.url)
					}}
					accept={["video/*"]}
					headers={{
						transformations: "mq-hls",
					}}
					disabled={props.loading}
				>
					Upload video
				</UploadButton>
				or
				<antd.Input
					placeholder="Set a video HLS URL"
					onChange={(e) => {
						handleChange("videoSourceURL", e.target.value)
					}}
					value={props.videoSourceURL}
					disabled={props.loading}
				/>
			</div>
		</div>
	)
}

export default VideoEditor
