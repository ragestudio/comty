import React from "react"

const AttachmentMedia = ({ file }) => {
	const isFile = file instanceof File
	const [localUrl, setLocalUrl] = React.useState(null)

	React.useEffect(() => {
		if (!isFile) {
			setLocalUrl(null)
			return
		}

		const url = URL.createObjectURL(file)

		setLocalUrl(url)

		return () => URL.revokeObjectURL(url)
	}, [file, isFile])

	if (!isFile) {
		return null
	}

	switch (file.type.split("/")[0]) {
		case "image":
			return <img src={localUrl} />
		case "video":
			return (
				<video
					src={localUrl}
					controls
				/>
			)
		case "audio":
			return (
				<audio
					src={localUrl}
					controls
				/>
			)
	}

	return null
}

export default AttachmentMedia
