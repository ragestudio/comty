import React from "react"
import { Progress } from "antd"
import UploadButton from "@components/UploadButton"

const VideoSegmentedUpload = () => {
	const [result, setResult] = React.useState(null)
	const [progress, setProgress] = React.useState(null)

	return (
		<div>
			<UploadButton
				onSuccess={(id, response) => {
					setResult(response)
				}}
				onProgress={(id, progress) => {
					setProgress({
						id,
						progress,
					})
				}}
				accept={["video/*"]}
				headers={{
					transmux: "mq-hls",
				}}
			>
				Upload video
			</UploadButton>

			{progress && (
				<div>
					<h2>Progress</h2>
					<Progress
						percent={progress.progress}
						status={
							progress.progress === 100 ? "success" : "active"
						}
					/>
				</div>
			)}

			{result && <code>{JSON.stringify(result, null, 2)}</code>}
		</div>
	)
}

export default VideoSegmentedUpload
