import React from "react"
import { Upload, Progress } from "antd"
import classnames from "classnames"
import queuedUploadFile from "@utils/queuedUploadFile"

import { Icons } from "@components/Icons"

import "./index.less"

const UploadButton = (props) => {
	const [uploading, setUploading] = React.useState(false)
	const [progress, setProgress] = React.useState(null)

	const handleOnStart = (file_uid, file) => {
		if (typeof props.onStart === "function") {
			props.onStart(file_uid, file)
		}
	}

	const handleOnProgress = (file_uid, progress) => {
		if (typeof props.onProgress === "function") {
			props.onProgress(file_uid, progress)
		}
	}

	const handleOnError = (file_uid, error) => {
		if (typeof props.onError === "function") {
			props.onError(file_uid, error)
		}
	}

	const handleOnSuccess = (file_uid, response) => {
		if (typeof props.onSuccess === "function") {
			props.onSuccess(file_uid, response)
		}
	}

	const handleUpload = async (req) => {
		setUploading(true)
		setProgress(1)

		handleOnStart(req.file.uid, req.file)

		await queuedUploadFile(req.file, {
			onFinish: (file, response) => {
				if (typeof props.ctx?.onUpdateItem === "function") {
					props.ctx.onUpdateItem(response.url)
				}

				if (typeof props.onUploadDone === "function") {
					props.onUploadDone(response)
				}

				setUploading(false)
				handleOnSuccess(req.file.uid, response)

				setTimeout(() => {
					setProgress(null)
				}, 1000)
			},
			onError: (file, error) => {
				setProgress(null)
				handleOnError(file.uid, error)
				setUploading(false)
			},
			onProgress: (file, progress) => {
				setProgress(progress)
				handleOnProgress(file.uid, progress)
			},
			headers: props.headers,
		})
	}

	return (
		<Upload
			customRequest={handleUpload}
			multiple={props.multiple ?? false}
			accept={props.accept ?? ["image/*", "video/*", "audio/*"]}
			progress={false}
			fileList={[]}
			className={classnames("uploadButton", {
				["uploading"]: !!progress || uploading,
			})}
			disabled={uploading}
		>
			<div className="uploadButton-content">
				{!progress &&
					(props.icon ?? (
						<Icons.FiUpload
							style={{
								margin: 0,
							}}
						/>
					))}

				{progress && (
					<Progress
						type="circle"
						percent={progress?.percent ?? 0}
						strokeWidth={20}
						format={() => null}
					/>
				)}

				{props.children ?? "Upload"}
			</div>
		</Upload>
	)
}

export default UploadButton
