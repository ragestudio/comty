import styles from "./index.module.less"

import { Input } from "antd"
import classNames from "clsx"
import UploadButton from "../UploadButton"
import createBem from "@/utils/createBem"
import React from "react"

const container = createBem("upload_file_url", styles)

export const UploadFileUrl = (
	props: {
		accept?: string
		onChange?: (value: string) => void
		value?: string
		defaultValue?: string
	} = {},
) => {
	const uploadRef = React.useRef(null)
	const [uploading, setUploading] = React.useState(false)
	const [internalValue, setInternalValue] = React.useState(
		props.defaultValue ?? "",
	)

	// controlled when the parent provides a value, uncontrolled otherwise
	const isControlled = props.value !== undefined
	const value = props.value ?? internalValue
	const previousDefaultValue = React.useRef(props.defaultValue)

	// reset the uncontrolled value when the parent provides a new default
	React.useEffect(() => {
		if (Object.is(previousDefaultValue.current, props.defaultValue)) {
			return
		}

		previousDefaultValue.current = props.defaultValue

		if (!isControlled) {
			setInternalValue(props.defaultValue ?? "")
		}
	}, [props.defaultValue, isControlled])

	const commitValue = (nextValue: string) => {
		if (!isControlled) {
			setInternalValue(nextValue)
		}

		props.onChange?.(nextValue)
	}

	const handleUploadStart = () => {
		setUploading(true)
	}

	const handleUploadDone = (file_uid: string, response: { url: string }) => {
		setUploading(false)

		if (response && response.url) {
			commitValue(response.url)
		}
	}

	const handleUploadError = () => {
		setUploading(false)
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		commitValue(event.target.value)
	}

	return (
		<div className={classNames(container(), "bg-accent", "border-default")}>
			<UploadButton
				ref={uploadRef}
				className={container.elem("button")}
				accept={props.accept ?? "*/*"}
				onStart={handleUploadStart}
				onSuccess={handleUploadDone}
				onError={handleUploadError}
			>
				<span>Upload file or</span>
			</UploadButton>

			<Input
				className={container.elem("field")}
				placeholder={"Input a URL"}
				onChange={handleInputChange}
				value={value}
				disabled={uploading}
			/>
		</div>
	)
}

export default UploadFileUrl
