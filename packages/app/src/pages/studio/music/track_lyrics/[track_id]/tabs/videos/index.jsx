import React, { useState, useCallback } from "react"
import {
	Card,
	Input,
	TimePicker,
	Space,
	Button,
	Empty,
	Switch,
	Typography,
	message,
} from "antd"
import {
	VideoCameraOutlined,
	ClockCircleOutlined,
	UploadOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

import { useLyricsEditor } from "../../context/LyricsEditorContext"
import UploadButton from "@components/UploadButton"
import VideoPlayer from "@components/VideoPlayer"

import "./index.less"

dayjs.extend(customParseFormat)

const { Title, Text } = Typography

const VideoEditor = () => {
	const { state, dispatch } = useLyricsEditor()
	const [inputUrl, setInputUrl] = useState(state.videoSource || "")

	const handleVideoUpload = useCallback(
		(response) => {
			const url = response.url

			dispatch({ type: "SET_VIDEO_SOURCE", payload: url })
			setInputUrl(url)

			message.success("Video uploaded successfully")
		},
		[dispatch],
	)

	const handleUrlChange = useCallback((e) => {
		const url = e.target.value
		setInputUrl(url)
	}, [])

	const handleUrlSet = useCallback(() => {
		if (inputUrl !== state.videoSource) {
			dispatch({ type: "SET_VIDEO_SOURCE", payload: inputUrl })
			message.success("Video URL updated")
		}
	}, [inputUrl, state.videoSource, dispatch])

	const handleSyncTimeChange = useCallback(
		(time, timeString) => {
			console.log("changed:", time, timeString)
			dispatch({ type: "SET_VIDEO_SYNC", payload: timeString })
		},
		[dispatch],
	)

	const handleLoopingChange = useCallback((checked) => {
		// Note: looping is not in simplified context, could be local state if needed
		console.log("Looping changed:", checked)

		dispatch({ type: "SET_VIDEO_LOOP", payload: checked })
	}, [])

	const videoControls = [
		"play",
		"current-time",
		"seek-time",
		"duration",
		"progress",
		"settings",
	]

	const syncTime = state.videoSyncTime
		? dayjs(state.videoSyncTime, "mm:ss:SSS")
		: null

	return (
		<div className="video-editor">
			{state.videoSource ? (
				<div className="video-preview">
					<VideoPlayer
						controls={videoControls}
						src={state.videoSource}
					/>
				</div>
			) : (
				<Empty
					image={
						<VideoCameraOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
					}
					description="No video loaded"
				/>
			)}

			<Space
				direction="vertical"
				style={{ width: "100%" }}
				size="large"
			>
				<div className="sync-controls">
					<Space>
						<Text>Set video mode:</Text>
						<Switch
							checked={state.videoLoop}
							onChange={handleLoopingChange}
							checkedChildren="Loop"
							unCheckedChildren="Synced"
						/>
					</Space>

					<Space
						align="center"
						wrap
					>
						<Text>Video sync:</Text>
						<TimePicker
							showNow={false}
							value={syncTime}
							format="mm:ss:SSS"
							onChange={handleSyncTimeChange}
							placeholder="mm:ss:SSS"
							disabled={state.videoLoop}
						/>
					</Space>
				</div>

				<div className="upload-controls">
					<Space
						direction="vertical"
						style={{ width: "100%" }}
					>
						<Space wrap>
							<UploadButton
								onSuccess={(_, data) => handleVideoUpload(data)}
								accept={["video/*"]}
								headers={{ transformations: "mq-hls" }}
								disabled={state.saving}
								icon={<UploadOutlined />}
							>
								Upload Video
							</UploadButton>
							<Text type="secondary">or</Text>
						</Space>

						<Space.Compact style={{ width: "100%" }}>
							<Input
								placeholder="Enter video HLS URL..."
								value={inputUrl}
								onChange={handleUrlChange}
								disabled={state.saving}
								onPressEnter={handleUrlSet}
							/>
							<Button
								type="primary"
								onClick={handleUrlSet}
								disabled={
									!inputUrl || inputUrl === state.videoSource || state.saving
								}
							>
								Set URL
							</Button>
						</Space.Compact>
					</Space>
				</div>
			</Space>
		</div>
	)
}

export default VideoEditor
