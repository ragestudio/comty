import React from "react"

const AttachmentMedia = ({ file }) => {
	if (!(file instanceof File)) {
		return null
	}

	const [localUrl, setLocalUrl] = React.useState(null)

	React.useEffect(() => {
		setLocalUrl(URL.createObjectURL(file))

		return () => {
			URL.revokeObjectURL(localUrl)
		}
	}, [file])

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
